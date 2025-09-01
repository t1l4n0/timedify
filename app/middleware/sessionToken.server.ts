import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export interface SessionTokenData {
  shop: string;
  user: string;
  sessionToken: string;
}

export async function validateSessionToken(request: Request): Promise<SessionTokenData | null> {
  try {
    // Session Token aus dem Authorization Header extrahieren
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const sessionToken = authHeader.replace("Bearer ", "");
    
    // Session Token mit Shopify Admin API verifizieren
    const { admin, session } = await authenticate.admin(request);
    
    if (!session) {
      return null;
    }

    return {
      shop: session.shop,
      user: session.accessToken || "unknown",
      sessionToken: sessionToken
    };
  } catch (error) {
    console.error("Session Token validation error:", error);
    return null;
  }
}

export async function requireSessionToken(request: Request): Promise<SessionTokenData> {
  const sessionData = await validateSessionToken(request);
  
  if (!sessionData) {
    throw json(
      { error: "Unauthorized - Invalid session token" },
      { status: 401 }
    );
  }
  
  return sessionData;
}
