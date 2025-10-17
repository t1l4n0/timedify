import "@shopify/shopify-api/adapters/node";
import type { JwtPayload } from "@shopify/shopify-api";
import { ApiVersion, shopifyApi } from "@shopify/shopify-api";
import type { Shopify } from "@shopify/shopify-api";

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

  const api = shopifyApi({
    apiKey,
    apiSecretKey: apiSecret,
    apiVersion: ApiVersion.October25,
    scopes: scopes ? scopes.split(",") : [],
    hostName: normalizedUrl.host,
    hostScheme: normalizedUrl.protocol.replace(":", ""),
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

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response(undefined, { status: 401, statusText: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
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

    return payload;
  } catch (error) {
    params.logger.debug(`Failed to validate session token: ${(error as Error).message}`);
    throw new Response(undefined, { status: 401, statusText: "Unauthorized" });
  }
}

export function __resetValidateSessionTokenCache() {
  cachedParams = null;
}
