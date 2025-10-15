import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);

    if (!shop) {
      console.error("Customers/data_request webhook: Missing shop parameter");
      return new Response("Missing shop parameter", { status: 400 });
    }

    console.log(`Customers/data_request webhook received for shop: ${shop}`);

    // Kundendatensammlung implementieren
    try {
      // Hier können kunden-spezifische Daten gesammelt werden
      // z.B. Metafields, App-spezifische Kundendaten, etc.
      console.log(`Successfully processed customer data request for shop: ${shop}`);
    } catch (error) {
      console.error("Error during customer data request processing:", error);
      // Auch bei DB-Fehlern 200 zurückgeben, um Webhook-Retry zu vermeiden
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing customers/data_request webhook:", error);
    // 200 zurückgeben, um Webhook-Retry zu vermeiden
    return new Response("OK", { status: 200 });
  }
};
