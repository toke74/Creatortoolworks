import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Playwright's baseURL (playwright.config.ts) drives the dev server from 127.0.0.1;
  // without this, Next.js blocks cross-origin dev/HMR requests from that host.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
