import { json } from "@remix-run/node";

export function loader() {
  return json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
