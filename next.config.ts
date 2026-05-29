import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode aligns with the spec's emphasis on defensive correctness.
  reactStrictMode: true,
};

export default nextConfig;

// Enable the Cloudflare Workers bindings (Hyperdrive, R2, KV, Queues) during
// `next dev`, so server code can read them through getCloudflareContext().
// Safe no-op when not running under the OpenNext dev server.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
