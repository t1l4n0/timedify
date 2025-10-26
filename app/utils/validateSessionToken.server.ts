import "@shopify/shopify-api/adapters/node";
import type { JwtPayload } from "@shopify/shopify-api";
import { ApiVersion, shopifyApi } from "@shopify/shopify-api";
import type { Shopify } from "@shopify/shopify-api";
import prisma from "~/db.server";
import crypto from "crypto";

type SessionValidationParams = {
  api: Shopify;
  config: unknown;
  logger: Shopify["logger"];
};

let cachedParams: SessionValidationParams | null = null;

function getBasicParams(): SessionValidationParams {
  if (cachedParams) {
    return cachedParams;
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const appUrl = process.env.SHOPIFY_APP_URL;
  const scopes = process.env.SCOPES;

  if (!apiKey || !apiSecret || !appUrl) {
    throw new Error("Missing Shopify environment configuration for session token validation.");
  }

  const normalizedUrl = new URL(appUrl);

  if (normalizedUrl.hostname === "localhost" && !normalizedUrl.port && process.env.PORT) {
    normalizedUrl.port = process.env.PORT;
  }

  const hostScheme = normalizedUrl.protocol.replace(":", "");
  if (hostScheme !== "http" && hostScheme !== "https") {
    throw new Error(`Unsupported host scheme for session token validation: ${hostScheme}`);
  }

  const api = shopifyApi({
    apiKey,
    apiSecretKey: apiSecret,
    apiVersion: ApiVersion.October25,
    scopes: scopes ? scopes.split(",") : [],
    hostName: normalizedUrl.host,
    hostScheme,
    isEmbeddedApp: true,
  });

  cachedParams = {
    api,
    config: {},
    logger: api.logger,
  };

  return cachedParams;
}

export async function validateSessionToken(request: Request): Promise<JwtPayload> {
  const authHeader = request.headers.get("Authorization");
  const endpoint = new URL(request.url).pathname;

  if (!authHeader?.startsWith("Bearer ")) {
    await trackSessionTokenEvent(false, endpoint, "missing-auth-header");
    throw new Response(undefined, { status: 401, statusText: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    await trackSessionTokenEvent(false, endpoint, "empty-token");
    throw new Response(undefined, { status: 401, statusText: "Unauthorized" });
  }

  const params = getBasicParams();

  try {
    const payload = await params.api.session.decodeSessionToken(token, {
      checkAudience: true,
    });

    params.logger.debug("Session token is valid - validated", {
      payload: JSON.stringify(payload),
    });

    // Track successful validation
    await trackSessionTokenEvent(true, endpoint, payload.sub || "unknown-shop");

    return payload;
  } catch (error) {
    params.logger.debug(`Failed to validate session token: ${(error as Error).message}`);
    
    // Track failed validation
    await trackSessionTokenEvent(false, endpoint, "validation-failed");
    
    throw new Response(undefined, { status: 401, statusText: "Unauthorized" });
  }
}

/**
 * Tracks session token validation events for Built-for-Shopify compliance.
 * Pseudonymizes shop domain and stores success/failure metrics.
 */
async function trackSessionTokenEvent(success: boolean, endpoint: string, shop: string) {
  try {
    // Pseudonymize shop domain for privacy compliance
    const shopHash = crypto.createHash('sha256').update(shop).digest('hex').slice(0, 16);
    
    await prisma.sessionTokenEvent.create({
      data: {
        success,
        shopHash,
        endpoint,
      },
    });
  } catch (error) {
    // Don't fail the main request if tracking fails
    console.warn('Failed to track session token event:', error);
  }
}

export function __resetValidateSessionTokenCache() {
  cachedParams = null;
}
