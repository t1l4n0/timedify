import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    return json({
      success: true,
      message: "Session token endpoint ready",
      requiresAuth: false
    });
  } catch (error) {
    return json(
      { 
        success: false, 
        error: "Service unavailable" 
      },
      { status: 500 }
    );
  }
}

export async function action({ request }: LoaderFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    
    if (body.action === 'getSessionToken') {
      // Echte Session Token von Shopify anfordern
      const { admin, session } = await authenticate.admin(request);
      
      if (!session) {
        return json({ error: "No valid session" }, { status: 401 });
      }

      // Session Token für die aktuelle Session generieren
      const sessionToken = await (admin as any).sessionToken.create({
        isOnline: false,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 Stunden
      });

      return json({
        success: true,
        sessionToken: sessionToken.token,
        message: "Session token generated successfully",
        type: "real",
        expires: sessionToken.expires
      });
    }
    
    return json({
      success: true,
      message: "Action completed successfully"
    });
  } catch (error) {
    console.error("Session token error:", error);
    return json(
      { 
        success: false, 
        error: "Failed to generate session token" 
      },
      { status: 500 }
    );
  }
}
