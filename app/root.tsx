import type { LinksFunction, HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { json, type SerializeFrom } from "@remix-run/node";
import { useMemo } from "react";
import { I18nManager, I18nContext, useI18n } from "@shopify/react-i18n";
import { APP_LOCALES, getLocale, type SupportedLocale } from "~/locales";

// Variante A (robust mit Vite/Remix):
import polarisStylesUrl from "@shopify/polaris/build/esm/styles.css?url";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://cdn.shopify.com", crossOrigin: "anonymous" },
  { rel: "dns-prefetch", href: "https://img.youtube.com" },
  { rel: "preconnect", href: "https://img.youtube.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css" },
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
            src="https://cdn.shopify.com/shopifycloud/app-bridge.js" 
            data-api-key={apiKey}
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
