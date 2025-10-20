import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Webhook: app/subscriptions/update → setzt Shop-Metafield timedify.subscription_active (boolean)
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Debug: URL für Monitoring loggen
    console.log(`[Webhook] app_subscriptions/update called at: ${request.url}`);
    
    // HMAC-Verifikation und Admin-Client holen
    const { topic, shop, payload, admin } = await authenticate.webhook(request);

    // Robustheit: Topic-Check nur für Logging; Route ist bereits eindeutig
    if (topic && topic.toUpperCase() !== "APP/SUBSCRIPTIONS/UPDATE") {
      console.warn(`Unexpected topic at /webhooks/app/subscriptions/update: ${topic}`);
    }

    // Kurze, sichere Verarbeitung: aktive Subscriptions abfragen
    if (admin && shop) {
      // Shop-ID holen
      const shopResponse = await admin.graphql(`#graphql
        query getShopId { shop { id } }
      `);
      const shopData = await shopResponse.json();
      const shopId = shopData?.data?.shop?.id;

      if (shopId) {
        // Aktive Subscriptions prüfen
        const activeResp = await admin.graphql(`#graphql
          query getActive { appInstallation { activeSubscriptions { id name status } } }
        `);
        const activeData = await activeResp.json();
        const activeList = activeData?.data?.appInstallation?.activeSubscriptions ?? [];
        const isActive = Array.isArray(activeList) && activeList.length > 0;

        // Metafield setzen
        await admin.graphql(`#graphql
          mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              userErrors { field message code }
            }
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
        });
      }
    }

    // Immer 200 OK ≤ 5s
    return json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("APP/SUBSCRIPTIONS/UPDATE: webhook error:", err);
    // 200 zurückgeben; Shopify retried bei 5xx aggressiv
    return json({ ok: true }, { status: 200 });
  }
};

export const loader = () => new Response(null, { status: 405 });

