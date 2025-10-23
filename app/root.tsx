import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { json, type SerializeFrom } from "@remix-run/node";
import { useMemo } from "react";
import { I18nManager, I18nContext, useI18n } from "@shopify/react-i18n";
import { APP_LOCALES, getLocale, type SupportedLocale } from "~/locales";
import { randomBytes } from "node:crypto";

// Variante A (robust mit Vite/Remix):
import polarisStylesUrl from "@shopify/polaris/build/esm/styles.css?url";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://cdn.shopify.com", crossOrigin: "anonymous" },
  { rel: "dns-prefetch", href: "https://img.youtube.com" },
  { rel: "preconnect", href: "https://img.youtube.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css" },
  { rel: "stylesheet", href: polarisStylesUrl },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = getLocale(request);
  const url = new URL(request.url);
  const host = url.searchParams.get("host") ?? "";
  const shop = url.searchParams.get("shop") ?? "";
  const nonce = randomBytes(16).toString("base64");

  // Strikte CSP mit Nonce; App Bridge CDN explizit erlauben
  const csp = [
    // Nur im Admin/Shop einbettbar
    "frame-ancestors https://admin.shopify.com https://*.myshopify.com",
    // Standardquellen
    "default-src 'self' https://cdn.shopify.com",
    // Skripte: eigene + noncete Inline-Skripte + App Bridge CDN
    `script-src 'self' 'nonce-${nonce}' https://cdn.shopify.com`,
    // Styles: Polaris/Inter von CDN, Inline-Styles in Polaris-Komponenten
    "style-src 'self' 'unsafe-inline' https://cdn.shopify.com",
    // Verbindungen zu Shopify-APIs
    "connect-src 'self' https://*.myshopify.com https://admin.shopify.com https://cdn.shopify.com",
    // Medien/Images erlauben
    "img-src 'self' data: https:",
    // Härtere Defaults
    "object-src 'none'",
    "base-uri 'none'",
  ].join("; ");

  return json(
    {
      apiKey: process.env.SHOPIFY_API_KEY ?? "",
      host,
      shop,
      locale,
      nonce,
    },
    { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate", "Content-Security-Policy": csp } }
  );
}

export type RootLoaderData = SerializeFrom<typeof loader>;

function AppWithTranslations({
  locale,
  apiKey,
  host,
  shop,
  nonce,
}: {
  locale: SupportedLocale;
  apiKey: string;
  host: string;
  shop: string;
  nonce: string;
}) {
  const [_i18n, ShareTranslations] = useI18n({
    id: "app",
    translations: APP_LOCALES,
    fallback: APP_LOCALES.en,
  });

  return (
    <ShareTranslations>
      <html lang={locale}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <meta name="shopify-api-key" content={apiKey} />
          {host ? <meta name="shopify-host" content={host} /> : null}
          {shop ? <meta name="shopify-shop-domain" content={shop} /> : null}
          <script 
            src="https://cdn.shopify.com/shopifycloud/app-bridge.js" 
            data-api-key={apiKey}
            nonce={nonce}
          />
          <Meta />
          <Links />
        </head>
        <body>
          <Outlet />
          <ScrollRestoration />
          <Scripts nonce={nonce} />
        </body>
      </html>
    </ShareTranslations>
  );
}

export default function App() {
  const { locale, apiKey, host, shop, nonce } = useLoaderData<typeof loader>();
  const manager = useMemo(
    () => new I18nManager({ locale, fallbackLocale: "en" }),
    [locale]
  );

  return (
    <I18nContext.Provider value={manager}>
      <AppWithTranslations locale={locale} apiKey={apiKey} host={host} shop={shop} nonce={nonce} />
    </I18nContext.Provider>
  );
}
