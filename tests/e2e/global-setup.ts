import { BASE_URL } from "./port";

// Every route the e2e suite visits, fetched once and in sequence before any
// parallel worker starts. `next dev`/Turbopack compiles each route lazily on
// its first request; hitting several routes at once (multiple workers'
// first navigations landing together) has been observed to occasionally
// crash the page with a transient RSC "Unexpected end of JSON input" error.
// Warming each route serially here means workers only ever hit already-
// compiled routes, removing the race instead of just slowing it down.
const ROUTES_TO_WARM = [
  "/",
  "/youtube-tools",
  "/youtube-tools/thumbnail-size-checker",
  "/youtube-tools/youtube-timestamp-generator",
  "/youtube-tools/youtube-description-formatter",
  "/sitemap.xml",
];

export default async function globalSetup() {
  for (const route of ROUTES_TO_WARM) {
    // A handful of retries: the dev server may still be finishing its very
    // first compile (of this route or a shared chunk) when we arrive.
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const response = await fetch(`${BASE_URL}${route}`);
        if (response.ok || response.status === 404) break;
      } catch {
        // server not reachable yet on this attempt — retry below
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}
