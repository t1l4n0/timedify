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
                  Datenschutzerklärung
                </Text>
                
                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    1. Verantwortlicher
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Verantwortlicher für die Datenverarbeitung im Rahmen dieser Shopify App ist:
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem", marginLeft: "1rem" }}>
                    Timedify App<br />
                    E-Mail: privacy@timedify.app<br />
                    Website: https://timedify.app
                  </Text>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    2. Zweck der Datenverarbeitung
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Die Timedify App verarbeitet Daten ausschließlich für folgende Zwecke:
                  </Text>
                  <ul style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
                    <li><Text as="span" variant="bodyMd">Bereitstellung der App-Funktionalität (zeitgesteuerte Inhalte)</Text></li>
                    <li><Text as="span" variant="bodyMd">Abrechnung und Verwaltung von Abonnements</Text></li>
                    <li><Text as="span" variant="bodyMd">Technische Unterstützung und Wartung</Text></li>
                    <li><Text as="span" variant="bodyMd">Erfüllung rechtlicher Verpflichtungen</Text></li>
                  </ul>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    3. Arten der verarbeiteten Daten
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Wir verarbeiten folgende Kategorien von Daten:
                  </Text>
                  <ul style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
                    <li><Text as="span" variant="bodyMd"><strong>Shop-Daten:</strong> Shop-Name, Domain, Zeitzone</Text></li>
                    <li><Text as="span" variant="bodyMd"><strong>Abonnement-Daten:</strong> Abonnement-Status, Abrechnungsinformationen</Text></li>
                    <li><Text as="span" variant="bodyMd"><strong>App-Konfiguration:</strong> Zeitfenster-Einstellungen, Metafield-Daten</Text></li>
                    <li><Text as="span" variant="bodyMd"><strong>Technische Daten:</strong> Logs, Fehlerberichte (anonymisiert)</Text></li>
                  </ul>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    4. Rechtsgrundlage
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Die Verarbeitung erfolgt auf Grundlage von:
                  </Text>
                  <ul style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
                    <li><Text as="span" variant="bodyMd">Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</Text></li>
                    <li><Text as="span" variant="bodyMd">Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)</Text></li>
                    <li><Text as="span" variant="bodyMd">Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung)</Text></li>
                  </ul>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    5. Datenweitergabe
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Wir geben Ihre Daten nicht an Dritte weiter, außer:
                  </Text>
                  <ul style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
                    <li><Text as="span" variant="bodyMd">An Shopify (gemäß deren Datenschutzbestimmungen)</Text></li>
                    <li><Text as="span" variant="bodyMd">Bei rechtlicher Verpflichtung</Text></li>
                    <li><Text as="span" variant="bodyMd">Mit Ihrer ausdrücklichen Einwilligung</Text></li>
                  </ul>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    6. Datenspeicherung
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Daten werden nur so lange gespeichert, wie es für die Erfüllung der Zwecke erforderlich ist:
                  </Text>
                  <ul style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
                    <li><Text as="span" variant="bodyMd">Aktive Abonnements: Während der Laufzeit</Text></li>
                    <li><Text as="span" variant="bodyMd">Beendete Abonnements: 3 Jahre (Abrechnungsnachweis)</Text></li>
                    <li><Text as="span" variant="bodyMd">Logs: 30 Tage (anonymisiert)</Text></li>
                  </ul>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    7. Ihre Rechte
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Sie haben folgende Rechte bezüglich Ihrer Daten:
                  </Text>
                  <ul style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
                    <li><Text as="span" variant="bodyMd">Auskunft (Art. 15 DSGVO)</Text></li>
                    <li><Text as="span" variant="bodyMd">Berichtigung (Art. 16 DSGVO)</Text></li>
                    <li><Text as="span" variant="bodyMd">Löschung (Art. 17 DSGVO)</Text></li>
                    <li><Text as="span" variant="bodyMd">Einschränkung (Art. 18 DSGVO)</Text></li>
                    <li><Text as="span" variant="bodyMd">Datenübertragbarkeit (Art. 20 DSGVO)</Text></li>
                    <li><Text as="span" variant="bodyMd">Widerspruch (Art. 21 DSGVO)</Text></li>
                  </ul>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    8. Datensicherheit
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Wir verwenden angemessene technische und organisatorische Maßnahmen zum Schutz Ihrer Daten:
                  </Text>
                  <ul style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
                    <li><Text as="span" variant="bodyMd">Verschlüsselung in Ruhe und Übertragung</Text></li>
                    <li><Text as="span" variant="bodyMd">Regelmäßige Sicherheitsupdates</Text></li>
                    <li><Text as="span" variant="bodyMd">Zugriffskontrollen und -protokollierung</Text></li>
                    <li><Text as="span" variant="bodyMd">Regelmäßige Backups</Text></li>
                  </ul>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    9. Cookies und Tracking
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Die App verwendet nur technisch notwendige Cookies für die Funktionalität. 
                    Keine Tracking-Cookies oder Analytics-Tools werden eingesetzt.
                  </Text>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    10. Kontakt
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Bei Fragen zum Datenschutz wenden Sie sich an:
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem", marginLeft: "1rem" }}>
                    E-Mail: privacy@timedify.app<br />
                    Betreff: Datenschutz Timedify App
                  </Text>
                </div>

                <div style={{ marginTop: "2rem" }}>
                  <Text as="h2" variant="headingMd">
                    11. Änderungen
                  </Text>
                  <Text as="p" variant="bodyMd" style={{ marginTop: "0.5rem" }}>
                    Diese Datenschutzerklärung kann bei Bedarf aktualisiert werden. 
                    Wesentliche Änderungen werden über die App-Benachrichtigungen kommuniziert.
                  </Text>
                </div>

                <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #e1e3e5" }}>
                  <Text as="p" variant="bodySm" style={{ color: "#6d7175" }}>
                    Stand: {new Date().toLocaleDateString('de-DE')}
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
