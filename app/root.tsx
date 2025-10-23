import type { LinksFunction, HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { json, type SerializeFrom } from "@remix-run/node";
import { useMemo } from "react";
import { I18nManager, I18nContext, useI18n } from "@shopify/react-i18n";
import { APP_LOCALES, getLocale, type SupportedLocale } from "~/locales";

// Variante A (robust mit Vite/Remix):
import polarisStylesUrl from "@shopify/polaris/build/esm/styles.css?url";

const FALLBACK_POLARIS_SEED_STYLES = [
  ":root{color-scheme:light;--p-color-bg:rgba(241,241,241,1);--p-color-bg-surface:rgba(255,255,255,1);--p-color-text:rgba(48,48,48,1);--p-font-family-sans:'Inter',-apple-system,BlinkMacSystemFont,'San Francisco','Segoe UI',Roboto,'Helvetica Neue',sans-serif;--p-font-size-325:0.8125rem;--p-font-line-height-500:1.25rem;--p-font-weight-regular:450;--p-motion-duration-100:100ms;--p-motion-ease-in:cubic-bezier(0.42,0,1,1);}",
  "html{font-size:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-text-size-adjust:100%;-moz-text-size-adjust:100%;text-size-adjust:100%;text-rendering:optimizeLegibility;}",
  "body{margin:0;background-color:var(--p-color-bg);color:var(--p-color-text);min-height:100vh;font-family:var(--p-font-family-sans);font-size:var(--p-font-size-325);line-height:var(--p-font-line-height-500);font-weight:var(--p-font-weight-regular);font-feature-settings:'calt' 0;letter-spacing:initial;-webkit-font-smoothing:antialiased;}",
  "button{font-family:var(--p-font-family-sans);}",
].join("");

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://cdn.shopify.com", crossOrigin: "anonymous" },
  { rel: "dns-prefetch", href: "https://img.youtube.com" },
  { rel: "preconnect", href: "https://img.youtube.com", crossOrigin: "anonymous" },
  {
    rel: "preload",
    href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css",
    as: "style",
    crossOrigin: "anonymous",
  },
  { rel: "stylesheet", href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css" },
  { rel: "preload", href: polarisStylesUrl, as: "style" },
  { rel: "stylesheet", href: polarisStylesUrl },
];

export const headers: HeadersFunction = () => {
  return {
    // Erlaubt Einbettung im Admin und Shop-Domain, blockt sonstige Frames
    "Content-Security-Policy":
      "frame-ancestors https://admin.shopify.com https://*.myshopify.com;",
    // HTML nie cachen (kurzlebige host/shop/Token-Parameter)
    "Cache-Control": "private, no-store",
  };
};

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = getLocale(request);
  const url = new URL(request.url);
  const host = url.searchParams.get("host") ?? "";
  const shop = url.searchParams.get("shop") ?? "";

  return json(
    {
      apiKey: process.env.SHOPIFY_API_KEY ?? "",
      host,
      shop,
      locale,
    },
    { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } }
  );
}

export type RootLoaderData = SerializeFrom<typeof loader>;

function createAppBridgeConfigScript({
  apiKey,
  host,
  shop,
}: {
  apiKey: string;
  host: string;
  shop: string;
}) {
  if (!apiKey) {
    return "window.shopify = window.shopify || {};";
  }

  const config: Record<string, string | boolean> = {
    apiKey,
    forceRedirect: true,
  };

  if (host) {
    config.host = host;
  }

  if (shop) {
    config.shop = shop;
  }

  const serializedConfig = JSON.stringify(config).replace(/</g, "\\u003C");

  return `window.shopify = window.shopify || {};\nwindow.shopify.config = { ...window.shopify.config, ...${serializedConfig} };`;
}

function AppWithTranslations({
  locale,
  apiKey,
  host,
  shop,
}: {
  locale: SupportedLocale;
  apiKey: string;
  host: string;
  shop: string;
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
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: createAppBridgeConfigScript({ apiKey, host, shop }),
            }}
          />
          <style
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
            }}
          />
          <Meta />
          <Links />
        </head>
        <body>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </ShareTranslations>
  );
}

export default function App() {
  const { locale, apiKey, host, shop } = useLoaderData<typeof loader>();
  const manager = useMemo(
    () => new I18nManager({ locale, fallbackLocale: "en" }),
    [locale]
  );

  return (
    <I18nContext.Provider value={manager}>
      <AppWithTranslations locale={locale} apiKey={apiKey} host={host} shop={shop} />
    </I18nContext.Provider>
  );
}
