import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode aligns with the spec's emphasis on defensive correctness.
  reactStrictMode: true,
};

export default nextConfig;

// Expose the Cloudflare Workers bindings (D1, R2, KV) during `next dev` so
// server code can read them through getCloudflareContext(). Only in dev — during
// `next build` we must not boot the workerd/Miniflare runtime.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
