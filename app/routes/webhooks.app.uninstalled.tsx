import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { ActionFunctionArgs } from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop } = await authenticate.webhook(request);

    if (!topic) {
      return new Response("Missing topic", { status: 400 });
    }

    if (topic === "APP_UNINSTALLED") {
      const payload = await request.json();
      console.log("App uninstalled:", payload);

      try {
        await prisma.$transaction([
          prisma.session.deleteMany({ where: { shop } }),
          // Add additional deleteMany calls here for other shop-specific models
        ]);
      } catch (error) {
        console.error("Error during DB cleanup:", error);
        return new Response("Error processing webhook", { status: 500 });
      }

      return new Response("OK", { status: 200 });
    }

    return new Response("Unhandled webhook topic", { status: 400 });
  } catch (error) {
    console.error("Error authenticating webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
};
