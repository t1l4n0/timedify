import type { HeadersFunction } from "@remix-run/node";

export const headers: HeadersFunction = () => ({
  "Cache-Control": "public, max-age=600, stale-while-revalidate=60",
  "X-Robots-Tag": "noindex, nofollow",
});

export default function Perf() {
  return (
    <main style={{maxWidth: 1200, margin: "0 auto", padding: 16}}>
      <h1>Timedify – Performance Snapshot</h1>
      <p>Öffentliche Testansicht für PageSpeed Insights.</p>
    </main>
  );
}
