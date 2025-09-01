import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Verifiziert die aktuelle Händler-Session (setzt 401/302 bei Bedarf)
  await authenticate.admin(request);
  return json({ ok: true, ts: Date.now() });
}
