import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Admin-geschützter Endpoint; synchronisiert timedify.subscription_active anhand aktiver Subscriptions
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  try {
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
      });
    }

    return json({ ok: true, active: isActive }, { status: 200 });
  } catch (error) {
    return json({ ok: false, error: (error as Error).message }, { status: 200 });
  }
};

export const loader = () => new Response(null, { status: 405 });
