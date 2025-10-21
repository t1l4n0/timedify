import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError, isRouteErrorResponse, useRouteLoaderData } from "@remix-run/react";
import { AppProvider as PolarisProvider } from "@shopify/polaris";
import { createApp } from "@shopify/app-bridge";
import { authenticate } from "~/shopify.server";
import type { SerializeFrom } from "@remix-run/node";
import { Page, Layout, Card, Text, Banner } from "@shopify/polaris";
import { useI18n } from "@shopify/react-i18n";
import { POLARIS_LOCALES, getLocale } from "~/locales";
import type { RootLoaderData } from "~/root";
import { syncSubscriptionStatusToMetafield } from "~/utils/billing";

export const APP_ROUTE_ID = "routes/app" as const;

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  
  // Robuste API-Key-Validierung - fängt Misconfig früh ab
  const apiKey = process.env.SHOPIFY_API_KEY;
  if (!apiKey) {
    throw new Error("SHOPIFY_API_KEY environment variable is not set. Please check your configuration.");
  }

  // Abo-Status ermitteln (wie in der vorherigen Startseite)
  let hasActiveSub = false;
  try {
    const response = await admin.graphql(`#graphql
      query {
        currentAppInstallation {
          activeSubscriptions { id name status currentPeriodEnd }
        }
      }
    `);
    const { data } = await response.json();
    const activeSubs = data?.currentAppInstallation?.activeSubscriptions ?? [];
    hasActiveSub = activeSubs.some((sub: any) => sub.status === "ACTIVE" && new Date(sub.currentPeriodEnd) > new Date());
  } catch (_err) {
    hasActiveSub = false;
  }

  // Initial-Sync: Subscription status to metafield for Theme App Extensions
  try {
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
      await syncSubscriptionStatusToMetafield(admin, shopId);
    }
  } catch (error) {
    console.error("Failed to sync subscription status to metafield:", error);
    // Don't fail the entire request if metafield sync fails
  }
  
  const locale = getLocale(request);
  return json(
    {
      apiKey,
      polarisTranslations: POLARIS_LOCALES[locale],
      shop: session.shop,
      hasActiveSub,
      // Expose debug UI flags to client (for gating debug components)
      showDebugUi: process.env.TIMEDIFY_SHOW_DEBUG_UI === "true",
      debugShops: (process.env.TIMEDIFY_DEBUG_SHOPS || "").split(",").map((s) => s.trim()).filter(Boolean),
    },
    { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } }
  );
}

export type AppLoaderData = SerializeFrom<typeof loader>;

export default function AppLayout() {
  const { polarisTranslations, apiKey, shop } = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData("root") as RootLoaderData;
  const { host } = rootData;
  
  // Nur App Bridge initialisieren wenn alle erforderlichen Parameter vorhanden sind
  const shouldInitializeAppBridge = apiKey && shop && host;
  
  // App Bridge global initialisieren (nur einmal)
  if (typeof window !== "undefined" && shouldInitializeAppBridge) {
    try {
      // Prüfe ob App Bridge bereits initialisiert wurde
      if (!(window as any).shopify) {
        createApp({
          apiKey,
          host,
          forceRedirect: true,
        });
      }
    } catch (error) {
      console.warn("Failed to initialize App Bridge:", error);
    }
  }
  
  if (!shouldInitializeAppBridge) {
    return (
      <PolarisProvider i18n={polarisTranslations}>
        <Page title="Timedify - Configuration Error">
          <Layout>
            <Layout.Section>
              <Card>
                <div style={{ padding: "1rem" }}>
                  <Banner
                    title="Configuration Error"
                    tone="critical"
                  >
                    <Text as="p" variant="bodyMd">
                      This app must be accessed through the Shopify admin panel. 
                      Please install and open the app from your Shopify admin.
                    </Text>
                  </Banner>
                </div>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </PolarisProvider>
    );
  }
  
  return (
    <PolarisProvider i18n={polarisTranslations}>
      <Outlet />
    </PolarisProvider>
  );
}

// Polaris-konforme ErrorBoundary für saubere Admin-UI
export function ErrorBoundary() {
  const error = useRouteError();

  const [i18n] = useI18n();
  const rootData = useRouteLoaderData("root") as RootLoaderData;
  const locale = rootData.locale;
  const polarisTranslations = POLARIS_LOCALES[locale];
  const { apiKey, host } = rootData;

  let errorMessage = i18n.translate("errorBoundary.unexpected");
  let errorDetails = "";

  if (isRouteErrorResponse(error)) {
    errorMessage = `Error ${error.status}: ${error.statusText}`;
    errorDetails = error.data?.message || "";
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack || "";
  }

  const shouldInitializeAppBridge = apiKey && host;

  // App Bridge global initialisieren (nur einmal)
  if (typeof window !== "undefined" && shouldInitializeAppBridge) {
    try {
      // Prüfe ob App Bridge bereits initialisiert wurde
      if (!(window as any).shopify) {
        createApp({
          apiKey,
          host,
          forceRedirect: true,
        });
      }
    } catch (error) {
      console.warn("Failed to initialize App Bridge:", error);
    }
  }

  return (
    <PolarisProvider i18n={polarisTranslations}>
      <Page title={i18n.translate("errorBoundary.title")}>
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: "1rem" }}>
                <Banner
                  title={i18n.translate("errorBoundary.somethingWrong")}
                  tone="critical"
                  action={{
                    content: i18n.translate("errorBoundary.tryAgain"),
                    onAction: () => window.location.reload(),
                  }}
                >
                  <Text as="p" variant="bodyMd">
                    {errorMessage}
                  </Text>
                  {errorDetails && (
                    <details style={{ marginTop: "1rem" }}>
                      <summary style={{ cursor: "pointer", color: "#6d7175" }}>
                        <Text as="span" variant="bodySm">
                          {i18n.translate("errorBoundary.showDetails")}
                        </Text>
                      </summary>
                      <pre
                        style={{
                          marginTop: "0.5rem",
                          padding: "0.5rem",
                          backgroundColor: "#f6f6f7",
                          borderRadius: "4px",
                          fontSize: "12px",
                          overflow: "auto",
                        }}
                      >
                        {errorDetails}
                      </pre>
                    </details>
                  )}
                </Banner>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </PolarisProvider>
  );
}
