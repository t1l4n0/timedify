import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Text, Link } from "@shopify/polaris";
import { AppProvider as PolarisProvider } from "@shopify/polaris";
import { POLARIS_LOCALES, getLocale } from "~/locales";

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = getLocale(request);
  
  return json({
    locale,
    polarisTranslations: POLARIS_LOCALES[locale],
  });
}

export default function PublicPrivacyPolicy() {
  const { polarisTranslations } = useLoaderData<typeof loader>();

  return (
    <PolarisProvider i18n={polarisTranslations}>
      <Page 
        title="Privacy Policy - Timedify"
        breadcrumbs={[
          { content: "Timedify", url: "/" },
          { content: "Privacy Policy" }
        ]}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: "2rem" }}>
                <Text as="h1" variant="headingLg">
                  Privacy Policy
                </Text>
                
                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    Data Collection
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Timedify does not collect, store, or process any personal data from merchants or customers.
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    The app operates entirely within the merchant's Shopify theme and does not transmit any information externally.
                  </Text>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    How Timedify Works
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Timedify is a Shopify app that provides time-controlled content functionality:
                  </Text>
                  <ul style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
                    <li><Text as="span" variant="bodyMd">Content is controlled by time-based settings configured by the merchant</Text></li>
                    <li><Text as="span" variant="bodyMd">All functionality runs client-side within the merchant's store</Text></li>
                    <li><Text as="span" variant="bodyMd">No data is collected from store visitors or customers</Text></li>
                    <li><Text as="span" variant="bodyMd">No external tracking or analytics are implemented</Text></li>
                  </ul>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    Merchant Data
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    The only data processed by Timedify includes:
                  </Text>
                  <ul style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
                    <li><Text as="span" variant="bodyMd">Shop configuration (timezone, subscription status)</Text></li>
                    <li><Text as="span" variant="bodyMd">App settings (time windows, content blocks)</Text></li>
                    <li><Text as="span" variant="bodyMd">Subscription and billing information (via Shopify)</Text></li>
                  </ul>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    This data is stored securely and only used to provide the app's functionality.
                  </Text>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    Data Security
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    We implement appropriate security measures to protect any data we process:
                  </Text>
                  <ul style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
                    <li><Text as="span" variant="bodyMd">Data encryption in transit and at rest</Text></li>
                    <li><Text as="span" variant="bodyMd">Regular security updates and monitoring</Text></li>
                    <li><Text as="span" variant="bodyMd">Access controls and audit logging</Text></li>
                    <li><Text as="span" variant="bodyMd">Secure hosting infrastructure</Text></li>
                  </ul>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    Third-Party Services
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Timedify integrates with:
                  </Text>
                  <ul style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
                    <li><Text as="span" variant="bodyMd"><strong>Shopify:</strong> For app installation, billing, and basic shop information</Text></li>
                    <li><Text as="span" variant="bodyMd"><strong>Fly.io:</strong> For secure hosting and data processing</Text></li>
                  </ul>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    All third-party services are GDPR compliant and follow industry-standard security practices.
                  </Text>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    Your Rights
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    As a merchant using Timedify, you have the right to:
                  </Text>
                  <ul style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
                    <li><Text as="span" variant="bodyMd">Access your data</Text></li>
                    <li><Text as="span" variant="bodyMd">Correct inaccurate data</Text></li>
                    <li><Text as="span" variant="bodyMd">Delete your data</Text></li>
                    <li><Text as="span" variant="bodyMd">Data portability</Text></li>
                    <li><Text as="span" variant="bodyMd">Withdraw consent</Text></li>
                  </ul>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    Data Retention
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    We retain data only as long as necessary:
                  </Text>
                  <ul style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
                    <li><Text as="span" variant="bodyMd">Active subscriptions: During the subscription period</Text></li>
                    <li><Text as="span" variant="bodyMd">Inactive accounts: 30 days after cancellation</Text></li>
                    <li><Text as="span" variant="bodyMd">Billing records: As required by law (typically 7 years)</Text></li>
                  </ul>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    Cookies and Tracking
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Timedify does not use cookies or tracking technologies. The app operates without collecting any visitor data.
                  </Text>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    Contact
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    For questions about this privacy policy or data handling:
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem", marginLeft: "1rem" }}>
                    Email: tilanoroser at gmail dot com<br />
                    Subject: Timedify Privacy Policy
                  </Text>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    Changes to This Policy
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    We may update this privacy policy from time to time. Significant changes will be communicated through the app or via email.
                  </Text>
                </div>

                <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #e1e3e5" }}>
                  <Text as="p" variant="bodySm" style={{ color: "#6d7175" }}>
                    Last updated: {new Date().toLocaleDateString('en-US')}
                  </Text>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </PolarisProvider>
  );
}
