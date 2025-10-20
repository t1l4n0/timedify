import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const hmac = request.headers.get("X-Shopify-Hmac-Sha256");

    if (hmac) {
      const { topic, shop, payload } = await authenticate.webhook(request);

      if (topic?.toUpperCase() !== "APP/UNINSTALLED") {
        console.warn(`Unexpected topic at /webhooks/app/uninstalled: ${topic}`);
      }

      if (shop) {
        console.log(`APP/UNINSTALLED: queuing cleanup for ${shop}`);
        
        // Asynchrone Verarbeitung ohne await → Response sofort zurückgeben
        Promise.resolve().then(async () => {
          try {
            // Database cleanup
            await prisma.$transaction([
              prisma.session.deleteMany({ where: { shop } }),
              // Weitere Löschungen hier (z.B. Metafields, Jobs, etc.)
            ]);
            
            // Metafield cleanup - set subscription to false
            try {
              const result = await authenticate.webhook(request);
              const admin = result?.admin;
              if (!admin) {
                return;
              }
              const shopResponse = await admin.graphql(`#graphql
                query getShop {
                  shop {
                    id
                  }
                }
              `);
              const shopData = await shopResponse.json();
              const shopId = shopData.data?.shop?.id;

              if (shopId) {
                await admin.graphql(`#graphql
                  mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
                    metafieldsSet(metafields: $metafields) {
                      metafields { 
                        id 
                        namespace 
                        key 
                        value 
                        type 
                      }
                      userErrors { 
                        field 
                        message 
                        code 
                      }
                    }
                  }
                `, {
                  variables: {
                    metafields: [{
                      ownerId: shopId,
                      namespace: "timedify",
                      key: "subscription_active",
                      value: "false",
                      type: "boolean"
                    }]
                  }
                });
                console.log(`✅ Metafield set to false for uninstalled shop: ${shop}`);
              }
            } catch (metafieldError) {
              console.error(`❌ Metafield cleanup error for ${shop}:`, metafieldError);
            }
            
            console.log(`APP/UNINSTALLED: cleanup done for ${shop}`);
          } catch (err) {
            console.error(`APP/UNINSTALLED: cleanup error for ${shop}`, err);
          }
        });
      }
    } else {
      console.log("APP/UNINSTALLED: no HMAC (test request) → respond 200");
    }

    // Immer 200 OK innerhalb von 5s zurückgeben
    return json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("APP/UNINSTALLED: webhook error:", err);
    // Auch bei Fehler 200 zurückgeben, um Retries zu vermeiden
    return json({ ok: true }, { status: 200 });
  }
};

export const loader = () => new Response(null, { status: 405 });
