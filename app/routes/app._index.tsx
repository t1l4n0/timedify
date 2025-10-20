import { useRouteLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  MediaCard,
  VideoThumbnail,
  Modal,
  Banner,
  Collapsible,
  Badge,
  Spinner,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import type { AppLoaderData } from "./app";
import { APP_ROUTE_ID } from "./app";
import { useCallback, useState } from "react";

export default function Index() {
  const { hasActiveSub, apiKey, showDebugUi, debugShops, shop } = useRouteLoaderData(APP_ROUTE_ID) as AppLoaderData & {
    hasActiveSub: boolean;
    showDebugUi?: boolean;
    debugShops?: string[];
    shop: string;
  };
  const shopify = useAppBridge();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const syncFetcher = useFetcher();

  const videoId = 'Tvz61ykCn-I';
  const videoThumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  const goToAdmin = useCallback(
    (adminPath: string, addAppBlockId?: string, target?: string) => {
      let finalPath = adminPath;

      if (adminPath === "/themes/current/editor") {
        const params = new URLSearchParams();

        if (addAppBlockId) {
          const blockIdParam = `${apiKey}/${addAppBlockId}`;
          params.set("addAppBlockId", blockIdParam);
          params.set("target", target ?? "newAppsSection");
          params.set("template", target === "mainSection" ? "product" : "index");
        }

        const queryString = params.toString();
        if (queryString) {
          finalPath = `${adminPath}?${queryString}`;
        }
      }

      shopify.toast?.show?.("Opening Shopify admin…");

      const fallbackUrl = (() => {
        if (typeof window === "undefined") {
          return finalPath;
        }

        const params = new URLSearchParams(window.location.search);
        const hostParam = params.get("host");

        if (!hostParam) {
          return finalPath;
        }

        try {
          const decoded = atob(hostParam);
          const normalizedBase = decoded.startsWith("https://") ? decoded : `https://${decoded}`;
          const base = normalizedBase.replace(/\/$/, "");
          return `${base}${finalPath.startsWith("/") ? finalPath : `/${finalPath}`}`;
        } catch (error) {
          console.warn("Failed to decode host parameter", error);
          return finalPath;
        }
      })();

      window.open(fallbackUrl, "_parent");
    },
    [apiKey, shopify]
  );

  const handleSyncSubscription = useCallback(() => {
    syncFetcher.load('/api/sync-subscription');
  }, [syncFetcher]);

  const syncData = syncFetcher.data as any;
  const isSyncing = syncFetcher.state === 'loading';

  return (
    <Page title="Timedify - Time-Controlled Content">
      <Layout>
        <Layout.Section>
          <Banner
            title={hasActiveSub ? 'Subscription active' : 'No active subscription'}
            tone={hasActiveSub ? 'success' : 'warning'}
            action={hasActiveSub ? undefined : {
              content: '📋 View Plans',
              onAction: () => goToAdmin('/charges/timed-content-app/pricing_plans'),
            }}
          >
            <p>
              {hasActiveSub
                ? 'You can use all app features: time-controlled content blocks, multiple time windows, and automatic content hiding.'
                : 'A subscription is required to use all features.'}
            </p>
          </Banner>
        </Layout.Section>

        {(showDebugUi || (debugShops && debugShops.includes(shop))) && (
        <Layout.Section>
          <Card>
            <div style={{ padding: "1rem" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <div>
                  <Text as="h3" variant="headingMd">🔧 Debug & Sync</Text>
                  <div style={{ color: '#6d7175' }}>
                    <Text as="p" variant="bodyMd">
                      Sync subscription status to metafield for theme extensions
                    </Text>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button 
                    onClick={handleSyncSubscription}
                    loading={isSyncing}
                    disabled={isSyncing}
                  >
                    {isSyncing ? 'Syncing...' : '🔄 Sync Now'}
                  </Button>
                  <Button 
                    onClick={() => setShowDebugInfo(!showDebugInfo)}
                    variant="tertiary"
                  >
                    {showDebugInfo ? 'Hide' : 'Show'} Debug Info
                  </Button>
                </div>
              </div>

              {syncData && (
                <div style={{ marginTop: "1rem" }}>
                  <Banner
                    title={syncData.success ? 'Sync Successful' : 'Sync Failed'}
                    tone={syncData.success ? 'success' : 'critical'}
                  >
                    <p>
                      {syncData.success 
                        ? `Metafield synced successfully at ${syncData.timestamp}`
                        : `Error: ${syncData.error}`
                      }
                    </p>
                  </Banner>
                </div>
              )}

              <Collapsible
                open={showDebugInfo}
                id="debug-info"
                transition={{ duration: '200ms', timingFunction: 'ease-in-out' }}
              >
                <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#f6f6f7", borderRadius: "4px" }}>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <Text as="h4" variant="headingSm">
                    Debug Information
                    </Text>
                  </div>
                  
                  {syncData ? (
                    <div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div>
                          <Text as="span" variant="bodyMd" fontWeight="semibold">Shop:</Text>
                          <span style={{ marginLeft: "0.5rem" }}>
                            <Text as="span" variant="bodyMd">
                              {syncData.shop?.name} ({syncData.shop?.domain})
                            </Text>
                          </span>
                        </div>
                        
                        <div>
                          <Text as="span" variant="bodyMd" fontWeight="semibold">Subscription Status:</Text>
                          <span style={{ marginLeft: "0.5rem" }}>
                            <Badge 
                              tone={syncData.subscription?.hasActiveSubscription ? 'success' : 'warning'}
                            >
                              {syncData.subscription?.hasActiveSubscription ? 'Active' : 'Inactive'}
                            </Badge>
                          </span>
                        </div>
                        
                        <div>
                          <Text as="span" variant="bodyMd" fontWeight="semibold">Metafield Value:</Text>
                          <span style={{ marginLeft: "0.5rem" }}>
                            <Text as="span" variant="bodyMd">
                              {syncData.metafield?.current?.value || 'Not set'}
                            </Text>
                          </span>
                        </div>
                        
                        <div>
                          <Text as="span" variant="bodyMd" fontWeight="semibold">Metafield ID:</Text>
                          <span style={{ marginLeft: "0.5rem" }}>
                            <Text as="span" variant="bodyMd">
                              {syncData.metafield?.current?.id || 'N/A'}
                            </Text>
                          </span>
                        </div>
                        
                        {syncData.subscription?.subscriptions?.length > 0 && (
                          <div>
                            <Text as="span" variant="bodyMd" fontWeight="semibold">Subscriptions:</Text>
                            <div style={{ marginTop: "0.25rem" }}>
                              {syncData.subscription.subscriptions.map((sub: any, index: number) => (
                                <div key={index} style={{ fontSize: "12px", color: "#6d7175" }}>
                                  {sub.name} - {sub.status} (Ends: {sub.currentPeriodEnd})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#6d7175' }}>
                      <Text as="p" variant="bodyMd">
                        Click "Sync Now" to see debug information
                      </Text>
                    </div>
                  )}
                </div>
              </Collapsible>
            </div>
          </Card>
        </Layout.Section>
        )}

        <Layout.Section>
          <MediaCard
            title="Timedify – How it works"
            description="See how to set up time-controlled content in your Shopify store in under 2 minutes."
            primaryAction={{ content: 'Watch video', onAction: () => setIsVideoModalOpen(true) }}
          >
            <VideoThumbnail
              videoLength={120}
              thumbnailUrl={videoThumbnailUrl}
              onClick={() => setIsVideoModalOpen(true)}
            />
          </MediaCard>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "1rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <Text as="h3" variant="headingMd">
                  Welcome to Timedify
                </Text>
                <div style={{ marginTop: "0.5rem" }}>
                  <Text as="p" variant="bodyMd">
                    Timedify provides time-controlled content scheduling for Shopify stores. 
                    Schedule when content appears and disappears on your homepage, 
                    product pages, collection pages, and throughout your store with precise timing control.
                  </Text>
                </div>
              </div>
              <Text as="h3" variant="headingMd">Key Features</Text>
              <div style={{ marginTop: "1rem" }}>
                <div style={{ marginBottom: "1rem" }}>
                  <Text as="h4" variant="headingSm">⏰ Automatic Hiding</Text>
                  <Text as="p" variant="bodyMd">Content is hidden immediately when outside the time window - both before start time and after end time.</Text>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <Text as="h4" variant="headingSm">🔄 Multiple content</Text>
                  <Text as="p" variant="bodyMd">Show/hide multiple content simultaneously, such as products, text, images, videos, buttons, etc.</Text>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <Text as="h4" variant="headingSm">📅 Multiple Time Windows</Text>
                  <Text as="p" variant="bodyMd">Create multiple time-controlled sections for different promotions, weekly offers, or seasonal content.</Text>
                </div>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "1rem" }}>
              <Text as="h3" variant="headingMd">Setup guide</Text>
              <ol style={{ marginLeft: '1.5rem' }}>
                <li><Text as="span" variant="bodyMd"><strong>Open the Theme Editor:</strong> Online Store → Themes → Customize.</Text></li>
                <li><Text as="span" variant="bodyMd"><strong>Add Start block:</strong> Add "1. Timed Content: Start" to your section.</Text></li>
                <li><Text as="span" variant="bodyMd"><strong>Place your content:</strong> Products, text, images, videos, buttons, etc. after the start block.</Text></li>
                <li><Text as="span" variant="bodyMd"><strong>Add End block:</strong> Add "2. Timed Content: End" after your content.</Text></li>
                <li><Text as="span" variant="bodyMd"><strong>Configure timing:</strong> Set start and end date/time in the Start block settings.</Text></li>
                <li><Text as="span" variant="bodyMd"><strong>Save & test:</strong> Save and test on your storefront.</Text></li>
              </ol>
              <div style={{ marginTop: '1rem' }}>
                <Button variant="primary" onClick={() => goToAdmin('/themes/current/editor', 'a-timed-start', 'newAppsSection')}>
                  🎨 Go to Theme Editor
                </Button>
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* Review Section */}
        <Layout.Section>
          <Card>
            <div style={{ padding: "1rem", textAlign: "center" }}>
              <Text as="h3" variant="headingMd">Enjoying Timedify?</Text>
              <div style={{ marginBottom: "1rem" }}>
                <Text as="p" variant="bodyMd">
                  If Timedify helps you manage time‑controlled content, please consider leaving a review!
                </Text>
              </div>
              <Button
                variant="primary"
                tone="success"
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).shopify?.reviews?.request) {
                    (window as any).shopify.reviews.request().catch(() => {});
                  }
                }}
              >
                ⭐ Leave a Review
              </Button>
              <div style={{ marginTop: "0.5rem", color: "#6d7175" }}>
                <Text as="p" variant="bodySm">
                  Your feedback helps other merchants discover Timedify
                </Text>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title="Timedify Tutorial"
      >
        <Modal.Section>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
              title="Timedify Tutorial"
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </div>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
