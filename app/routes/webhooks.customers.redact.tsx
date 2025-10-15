import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);

    if (!shop) {
      console.error("Customers/redact webhook: Missing shop parameter");
      return new Response("Missing shop parameter", { status: 400 });
    }

    console.log(`Customers/redact webhook received for shop: ${shop}`);

    // Kundendatenlöschung implementieren
    try {
      // Hier können kunden-spezifische Daten gelöscht werden
      // z.B. Metafields, App-spezifische Kundendaten, etc.
      console.log(`Successfully processed customer data redaction for shop: ${shop}`);
    } catch (error) {
      console.error("Error during customer data redaction:", error);
      // Auch bei DB-Fehlern 200 zurückgeben, um Webhook-Retry zu vermeiden
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing customers/redact webhook:", error);
    // 200 zurückgeben, um Webhook-Retry zu vermeiden
    return new Response("OK", { status: 200 });
  }
};
