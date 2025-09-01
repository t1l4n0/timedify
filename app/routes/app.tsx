import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError, isRouteErrorResponse, useRouteLoaderData } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { authenticate } from "~/shopify.server";
import de from "@shopify/polaris/locales/de.json";
import type { SerializeFrom } from "@remix-run/node";
import { Page, Layout, Card, Text, Banner, Button } from "@shopify/polaris";
import type { RootLoaderData } from "~/root";

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
  
  return json(
    {
      apiKey,
      polarisTranslations: de,
      shop: session.shop,
      hasActiveSub,
    },
    { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } }
  );
}

export type AppLoaderData = SerializeFrom<typeof loader>;

export default function AppLayout() {
  const { apiKey, polarisTranslations } = useLoaderData<typeof loader>();
  
  return (
    <AppProvider 
      isEmbeddedApp 
      apiKey={apiKey} 
      i18n={polarisTranslations}
    >
      <Outlet />
    </AppProvider>
  );
}

// Polaris-konforme ErrorBoundary für saubere Admin-UI
export function ErrorBoundary() {
  const error = useRouteError();
  
  let errorMessage = "An unexpected error occurred.";
  let errorDetails = "";
  
  if (isRouteErrorResponse(error)) {
    errorMessage = `Error ${error.status}: ${error.statusText}`;
    errorDetails = error.data?.message || "";
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack || "";
  }
  
  // Robuster apiKey aus Root-Loader beziehen
  const rootData = useRouteLoaderData("root") as RootLoaderData;
  
  return (
    <AppProvider 
      isEmbeddedApp 
      apiKey={rootData?.apiKey ?? ""} 
      i18n={de}
    >
      <Page title="Error">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: "1rem" }}>
                <Banner
                  title="Something went wrong"
                  tone="critical"
                  action={{
                    content: "Try again",
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
                          Show error details
                        </Text>
                      </summary>
                      <pre style={{ 
                        marginTop: "0.5rem", 
                        padding: "0.5rem", 
                        backgroundColor: "#f6f6f7", 
                        borderRadius: "4px",
                        fontSize: "12px",
                        overflow: "auto"
                      }}>
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
    </AppProvider>
  );
}
