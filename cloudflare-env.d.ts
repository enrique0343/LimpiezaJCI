// Cloudflare Workers bindings available at runtime via getCloudflareContext().
// Regenerate from wrangler.jsonc with: npm run cf-typegen
interface CloudflareEnv {
  ASSETS: Fetcher;
  DB: D1Database;
  FOTOS: R2Bucket;
  SESSIONS: KVNamespace;
  SYNC_QUEUE?: Queue; // enabled with the Workers Paid plan
}
