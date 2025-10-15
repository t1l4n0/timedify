import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { ActionFunctionArgs } from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);

    if (!shop) {
      console.error("App/uninstalled webhook: Missing shop parameter");
      return new Response("Missing shop parameter", { status: 400 });
    }

    console.log(`App/uninstalled webhook received for shop: ${shop}`);

    // App-Datenlöschung implementieren
    try {
      await prisma.$transaction([
        // Alle Sessions für diesen Shop löschen
        prisma.session.deleteMany({ where: { shop } }),
        // Hier können weitere app-spezifische Daten gelöscht werden
        // z.B. Metafields, App-spezifische Daten, etc.
      ]);

      console.log(`Successfully cleaned up app data for shop: ${shop}`);
    } catch (error) {
      console.error("Error during app data cleanup:", error);
      // Auch bei DB-Fehlern 200 zurückgeben, um Webhook-Retry zu vermeiden
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing app/uninstalled webhook:", error);
    // 200 zurückgeben, um Webhook-Retry zu vermeiden
    return new Response("OK", { status: 200 });
  }
};
