import { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  // Blockiere alle Shopify-Metriken-Anfragen
  const url = new URL(request.url);
  
  if (url.pathname.includes('shopifycloud') || url.pathname.includes('metrics')) {
    return new Response("Blocked", { 
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
        'X-Robots-Tag': 'noindex, nofollow'
      }
    });
  }
  
  return new Response("OK", { status: 200 });
}
