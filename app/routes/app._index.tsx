import { useRouteLoaderData } from "@remix-run/react";
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
} from "@shopify/polaris";
import { useState } from "react";
import type { AppLoaderData } from "./app";
import { APP_ROUTE_ID } from "./app";

export default function Index() {
  const { shop, hasActiveSub } = useRouteLoaderData(APP_ROUTE_ID) as AppLoaderData & { hasActiveSub: boolean };
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const videoId = 'Tvz61ykCn-I';
  const videoThumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  const goToAdmin = (adminPath: string, addAppBlockId?: string, target?: string) => {
    const apiKey = 'e6e56f8533bfb028465f4cc4dfda86f9';
    
    let adminUrl: string;
    
    if (adminPath === '/themes/current/editor') {
      // Theme Editor - URL komplett neu aufbauen ohne eingehende Query-Parameter
      if (addAppBlockId) {
        const targetParam = target || 'newAppsSection';
        const templateParam = target === 'mainSection' ? 'product' : 'index';
        
        // URL komplett neu konstruieren
        const u = new URL(`https://${shop}/admin/themes/current/editor`);
        const blockIdParam = `${encodeURIComponent(apiKey)}/${encodeURIComponent(addAppBlockId)}`;
        u.search =
          `template=${encodeURIComponent(templateParam)}` +
          `&addAppBlockId=${blockIdParam}` +
          `&target=${encodeURIComponent(targetParam)}`;
        adminUrl = u.toString();
      } else {
        adminUrl = `https://${shop}/admin/themes/current/editor`;
      }
    } else if (adminPath === '/charges/timed-content-app/pricing_plans') {
      // Billing-URL - auch hier URL neu aufbauen
      const u = new URL(`https://${shop}/admin/settings/billing/apps/timed-content-app`);
      adminUrl = u.toString();
    } else {
      // Fallback für andere Admin-Pfade
      const u = new URL(`https://${shop}/admin${adminPath}`);
      adminUrl = u.toString();
    }
    
    // Top-Level-Redirect um Query-Parameter zu erhalten
    try {
      if (window.top) {
        window.top.location.href = adminUrl;
        return;
      }
    } catch (_e) {}
    window.location.href = adminUrl;
  };

  return (
    <Page title="Timedify - Time-Controlled Content">
      <Layout>
        <Layout.Section>
          <Banner
            title={hasActiveSub ? 'Subscription active' : 'No active subscription'}
            tone={hasActiveSub ? 'success' : 'warning'}
            action={hasActiveSub ? {
              content: '🎨 Go to Theme Editor',
              onAction: () => goToAdmin('/themes/current/editor', 'a-timed-start', 'newAppsSection'),
            } : {
              content: '📋 View Plans',
              onAction: () => goToAdmin('/charges/timed-content-app/pricing_plans'),
            }}
          >
            <p>
              {hasActiveSub
                ? 'You can use all app features.'
                : 'A subscription is required to use all features.'}
            </p>
          </Banner>
        </Layout.Section>

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
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={() => goToAdmin('/themes/current/editor', 'a-timed-start', 'newAppsSection')}>
                  🎨 Go to Theme Editor
                </Button>
                <Button variant="secondary" onClick={() => goToAdmin('/themes/current/editor', 'a-timed-start', 'newAppsSection')}>
                  ⏰ Add Start Block
                </Button>
                <Button variant="secondary" onClick={() => goToAdmin('/themes/current/editor', 'b-timed-end', 'newAppsSection')}>
                  🛑 Add End Block
                </Button>
                <Button variant="secondary" onClick={() => goToAdmin('/themes/current/editor', 'countify-countdown', 'mainSection')}>
                  ⏱️ Add Countdown (Product)
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