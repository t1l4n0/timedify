import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Für shop/redact ist kein admin context verfügbar, da der Shop bereits deinstalliert ist
    const { topic, shop, payload } = await authenticate.webhook(request);

    if (!shop) {
      console.error("Shop/redact webhook: Missing shop parameter");
      return new Response("Missing shop parameter", { status: 400 });
    }

    console.log(`Shop/redact webhook received for shop: ${shop}`);

    // Shop-Datenlöschung implementieren
    try {
      await prisma.$transaction([
        // Alle Sessions für diesen Shop löschen
        prisma.session.deleteMany({ where: { shop } }),
        // Hier können weitere shop-spezifische Daten gelöscht werden
        // z.B. Metafields, App-spezifische Daten, etc.
      ]);

      console.log(`Successfully cleaned up data for shop: ${shop}`);
    } catch (error) {
      console.error("Error during shop data cleanup:", error);
      // Auch bei DB-Fehlern 200 zurückgeben, um Webhook-Retry zu vermeiden
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing shop/redact webhook:", error);
    // 200 zurückgeben, um Webhook-Retry zu vermeiden
    return new Response("OK", { status: 200 });
  }
};
