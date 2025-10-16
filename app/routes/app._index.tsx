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
import { Redirect } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@shopify/app-bridge-react";
import type { AppLoaderData } from "./app";
import { APP_ROUTE_ID } from "./app";

export default function Index() {
  const { shop, hasActiveSub } = useRouteLoaderData(APP_ROUTE_ID) as AppLoaderData & { hasActiveSub: boolean };
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const app = useAppBridge();

  const videoId = 'Tvz61ykCn-I';
  const videoThumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  const goToAdmin = (adminPath: string, addAppBlockId?: string, target?: string, newContext: boolean = true) => {
    const apiKey = 'e6e56f8533bfb028465f4cc4dfda86f9';
    
    let adminUrl: string;
    
    if (adminPath === '/themes/current/editor') {
      // Theme Editor - direkt zum aktiven Theme Editor
      if (addAppBlockId) {
        const targetParam = target || 'newAppsSection';
        const templateParam = target === 'mainSection' ? 'product' : 'index';
        
        // Direkt zum Theme Editor des aktiven Themes mit App-Block
        // Verwende myshopify.com Domain und /current/editor für Deep-Links
        const u = new URL(`https://${shop}/admin/themes/current/editor`);
        const blockIdParam = `${apiKey}/${addAppBlockId}`;
        u.searchParams.set('template', templateParam);
        u.searchParams.set('addAppBlockId', blockIdParam);
        u.searchParams.set('target', targetParam);
        adminUrl = u.toString();
      } else {
        // Einfach zum Theme Editor des aktiven Themes
        adminUrl = `https://${shop}/admin/themes/current/editor`;
      }
    } else if (adminPath === '/charges/timed-content-app/pricing_plans') {
      // Managed Pricing URL - korrekte Billing-Seite
      const u = new URL(`https://${shop}/admin/charges/timed-content-app/pricing_plans`);
      adminUrl = u.toString();
    } else {
      // Fallback für andere Admin-Pfade
      const u = new URL(`https://${shop}/admin${adminPath}`);
      adminUrl = u.toString();
    }
    
    // Verwende App Bridge Redirect.Action.REMOTE für korrekte myshopify.com Navigation
    try {
      if (app) {
        const redirect = Redirect.create(app as any);
        redirect.dispatch(Redirect.Action.REMOTE, { 
          url: adminUrl, 
          newContext: newContext 
        });
      } else {
        // Fallback für den Fall, dass App Bridge nicht verfügbar ist
        if (newContext) {
          window.open(adminUrl, '_blank');
        } else {
          window.location.href = adminUrl;
        }
      }
    } catch (error) {
      // Fallback für den Fall, dass App Bridge nicht verfügbar ist
      if (newContext) {
        window.open(adminUrl, '_blank');
      } else {
        window.location.href = adminUrl;
      }
    }
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
              onAction: () => goToAdmin('/charges/timed-content-app/pricing_plans', undefined, undefined, false),
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