import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { validateSessionToken } from "~/utils/validateSessionToken.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await validateSessionToken(request);
  return json({ ok: true, ts: Date.now() });
}
