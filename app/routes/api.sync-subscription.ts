import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { validateSessionToken } from "~/utils/validateSessionToken.server";

// Session Token-geschützter Endpoint; synchronisiert timedify.subscription_active anhand aktiver Subscriptions
export const loader = () => new Response(null, { status: 405 });

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Session Token validieren
    const payload = await validateSessionToken(request);
    const shop = payload.dest.replace("https://", "");
    
    // Admin-Client mit gespeichertem Access Token holen
    const { admin } = await authenticate.admin(request);
    // Shop-ID holen
    const shopResp = await admin.graphql(`#graphql
      query getShopId { shop { id } }
    `);
    const shopData = await shopResp.json();
    const shopId = shopData?.data?.shop?.id;

    // Aktive Subscriptions
    const activeResp = await admin.graphql(`#graphql
      query getActive { appInstallation { activeSubscriptions { id status } } }
    `);
    const activeData = await activeResp.json();
    const activeList = activeData?.data?.appInstallation?.activeSubscriptions ?? [];
    const isActive = Array.isArray(activeList) && activeList.length > 0;

    if (shopId) {
      const idemKey = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
      await admin.graphql(`#graphql
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) { userErrors { field message code } }
        }
      `, {
        variables: {
          metafields: [{
            ownerId: shopId,
            namespace: "timedify",
            key: "subscription_active",
            value: isActive ? "true" : "false",
            type: "boolean",
          }],
        },
        headers: { "Idempotency-Key": idemKey },
      });
    }

    return json({ 
      success: true, 
      active: isActive,
      shop: { name: shop, domain: shop },
      subscription: { hasActiveSubscription: isActive },
      metafield: { current: { value: isActive ? "true" : "false" } },
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error("Sync subscription error:", error);
    return json({ 
      success: false, 
      error: (error as Error).message || "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 200 });
  }
};
