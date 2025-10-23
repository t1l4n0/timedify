import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { processWebhookSafely } from "~/utils/webhookHelpers";

// Webhook: app/subscriptions/update → setzt Shop-Metafield timedify.subscription_active (boolean)
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Debug: URL für Monitoring loggen
    console.log(`[Webhook] app_subscriptions/update called at: ${request.url}`);
    
    // HMAC-Verifikation und Admin-Client holen
    const { topic, shop, payload, admin } = await authenticate.webhook(request);
    const webhookId = request.headers.get("X-Shopify-Webhook-Id") || `${Date.now()}-${Math.random()}`;

    // Robustheit: Topic-Check nur für Logging; Route ist bereits eindeutig
    if (topic && topic.toUpperCase() !== "APP/SUBSCRIPTIONS/UPDATE") {
      console.warn(`Unexpected topic at /webhooks/app/subscriptions/update: ${topic}`);
    }

    if (admin && shop) {
      await processWebhookSafely(webhookId, topic || "app/subscriptions/update", shop, payload, async () => {
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
  
          // Metafield setzen (mit Idempotency-Key)
          const idemKey = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
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
            headers: { "Idempotency-Key": idemKey },
          });
        }
      });
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

