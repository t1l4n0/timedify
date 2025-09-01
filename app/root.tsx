import type { LinksFunction } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { json, type SerializeFrom } from "@remix-run/node";

// Variante A (robust mit Vite/Remix):
import polarisStylesUrl from "@shopify/polaris/build/esm/styles.css?url";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://cdn.shopify.com", crossOrigin: "anonymous" },
  { rel: "dns-prefetch", href: "https://img.youtube.com" },
  { rel: "preconnect", href: "https://img.youtube.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css" },
  { rel: "stylesheet", href: polarisStylesUrl },
];

export async function loader() {
  return json(
    { apiKey: process.env.SHOPIFY_API_KEY ?? "" },
    { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } }
  );
}

export type RootLoaderData = SerializeFrom<typeof loader>;

export default function App() {
  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
