import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const hmac = request.headers.get("X-Shopify-Hmac-Sha256");

    if (hmac) {
      const { topic, shop, payload } = await authenticate.webhook(request);

      if (topic?.toUpperCase() !== "CUSTOMERS/REDACT") {
        console.warn(`Unexpected topic at /webhooks/customers/redact: ${topic}`);
      }

      if (shop && payload) {
        console.log(`CUSTOMERS/REDACT: processing for ${shop}`);
        
        // Asynchrone Verarbeitung ohne await → Response sofort zurückgeben
        Promise.resolve().then(async () => {
          try {
            console.log(`CUSTOMERS/REDACT payload for ${shop}:`, JSON.stringify(payload));
            // TODO: Kundendaten löschen
            // - Metafields des Kunden entfernen
            // - App-spezifische Kundendaten anonymisieren/löschen
            // - Gemäß GDPR innerhalb von 30 Tagen vollständig löschen
          } catch (err) {
            console.error(`CUSTOMERS/REDACT: processing error for ${shop}`, err);
          }
        });
      }
    } else {
      console.log("CUSTOMERS/REDACT: no HMAC (test request) → respond 200");
    }

    // Immer 200 OK innerhalb von 5s zurückgeben
    return json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("CUSTOMERS/REDACT: webhook error:", err);
    // Auch bei Fehler 200 zurückgeben, um Retries zu vermeiden
    return json({ ok: true }, { status: 200 });
  }
};

export const loader = () => new Response(null, { status: 405 });

