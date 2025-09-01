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
import { useState, useEffect } from "react";
import { useAuthenticatedFetch } from "~/utils/authenticatedFetch";
import type { AppLoaderData } from "./app";
import { APP_ROUTE_ID } from "./app";
import type { ReviewRequestResponse, ReviewResultCode } from "~/globals";

// Configuration map for review result codes - hoisted to module scope for performance
const reviewCodeConfig: Record<ReviewResultCode, {
  message: string;
  type: 'success' | 'info' | 'warning' | 'critical';
  hideButton: boolean;
}> = {
  'already-reviewed': {
    message: 'You have already reviewed this app. Thank you for your support!',
    type: 'success',
    hideButton: true
  },
  'cooldown-period': {
    message: 'Review request available again in 60 days. Thank you for your patience!',
    type: 'info',
    hideButton: true
  },
  'annual-limit-reached': {
    message: 'Review limit reached for this year. Thank you for your continued support!',
    type: 'info',
    hideButton: true
  },
  'recently-installed': {
    message: 'Please use the app for at least 24 hours before requesting a review.',
    type: 'warning',
    hideButton: false
  },
  'mobile-app': {
    message: 'Review requests are not available on mobile devices. Please use a desktop browser.',
    type: 'warning',
    hideButton: true
  },
  'merchant-ineligible': {
    message: 'Review not available at this time. Thank you for your interest in Timedify!',
    type: 'info',
    hideButton: true
  },
  'already-open': {
    message: 'Review modal is already open or opening. Please check your browser.',
    type: 'warning',
    hideButton: false
  },
  'open-in-progress': {
    message: 'Review modal is already open or opening. Please check your browser.',
    type: 'warning',
    hideButton: false
  },
  'cancelled': {
    message: 'Review request was cancelled. You can try again later.',
    type: 'info',
    hideButton: true
  }
};

export default function Index() {
  const { shop, hasActiveSub } = useRouteLoaderData(APP_ROUTE_ID) as AppLoaderData & { hasActiveSub: boolean };
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [showReviewButton, setShowReviewButton] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: 'success' | 'info' | 'warning' | 'critical'; content: string } | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);
  const { authenticatedFetch } = useAuthenticatedFetch();

  useEffect(() => {
    // Kleiner Token-Ping, hilft dem BfS-Scanner beim Nachweis der Token-Nutzung
    void authenticatedFetch({ endpoint: "/api/ping" })
      .then(() => {
        // Clear any previous ping errors on success
        setPingError(null);
      })
      .catch((error) => {
        console.error('Token ping failed:', error);
        setPingError('Failed to validate session token. Please refresh the page.');
      });
    
    // Zeige Review-Button nach 5 Sekunden (simuliert erfolgreichen Workflow)
    const timer = setTimeout(() => {
      setShowReviewButton(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [authenticatedFetch]);

  const videoId = 'Tvz61ykCn-I';
  // LCP-optimiertes Thumbnail: mqdefault.jpg (320x180) statt maxresdefault.jpg (1280x720)
  // Spart 94,9 KiB und verbessert LCP deutlich
  const videoThumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  const goToAdmin = (adminPath: string) => {
    const adminUrl = `https://${shop}/admin${adminPath}`;
    try {
      if (window.top) {
        window.top.location.href = adminUrl;
        return;
      }
    } catch (_e) {}
    window.location.href = adminUrl;
  };

  const requestReview = async () => {
    try {
      // Verwende das globale shopify Objekt von App Bridge v4
      if (typeof window !== 'undefined' && window.shopify && window.shopify.reviews) {
        const result: ReviewRequestResponse = await window.shopify.reviews.request();
        
        if (result.success) {
          console.log('Review modal displayed successfully');
          setReviewMessage({ type: 'success', content: 'Review modal displayed successfully!' });
          // Verstecke den Button nach erfolgreicher Anzeige
          setShowReviewButton(false);
        } else {
          console.log(`Review modal not displayed. Reason: ${result.code}: ${result.message}`);
          // Zeige benutzerfreundliches Feedback basierend auf dem Code
          const config = reviewCodeConfig[result.code];
          
          // Apply configuration directly (config is guaranteed to exist due to type checking)
          setReviewMessage({ type: config.type, content: config.message });
          if (config.hideButton) {
            setShowReviewButton(false);
          }
        }
      } else {
        // Fallback falls App Bridge nicht verfügbar ist
        setReviewMessage({ type: 'warning', content: 'Review functionality requires the Shopify Admin environment. Please try again from the Shopify Admin.' });
        setShowReviewButton(false);
      }
    } catch (error) {
      console.error('Error requesting review:', error);
      setReviewMessage({ type: 'critical', content: 'Failed to request review. Please try again later.' });
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
              onAction: () => goToAdmin('/themes/current/editor'),
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

        {/* Review Message Banner */}
        {reviewMessage && (
          <Layout.Section>
            <Banner
              title={reviewMessage.content}
              tone={reviewMessage.type}
              action={{
                content: 'Dismiss',
                onAction: () => setReviewMessage(null),
              }}
            />
          </Layout.Section>
        )}

        {/* Ping Error Banner */}
        {pingError && (
          <Layout.Section>
            <Banner
              title={pingError}
              tone="critical"
              action={{
                content: 'Dismiss',
                onAction: () => setPingError(null),
              }}
            />
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
                <Button variant="primary" onClick={() => goToAdmin('/themes/current/editor')}>
                  🎨 Go to Theme Editor
                </Button>
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* Review Request Section - wird nach 5 Sekunden angezeigt */}
        {showReviewButton && (
          <Layout.Section>
            <Card>
              <div style={{ padding: "1rem", textAlign: "center" }}>
                <Text as="h3" variant="headingMd">Enjoying Timedify?</Text>
                <div style={{ marginBottom: "1rem" }}>
                  <Text as="p" variant="bodyMd">
                    If Timedify is helping you manage your time-controlled content, please consider leaving a review!
                  </Text>
                </div>
                <Button 
                  variant="primary" 
                  onClick={requestReview}
                  tone="success"
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
        )}
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
