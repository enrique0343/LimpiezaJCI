// Cloudflare Workers bindings available at runtime via getCloudflareContext().
// Regenerate from wrangler.jsonc with: npm run cf-typegen
// Keep optional bindings optional until they are provisioned and uncommented
// in wrangler.jsonc.
interface CloudflareEnv {
  ASSETS: Fetcher;
  HYPERDRIVE?: Hyperdrive;
  FOTOS?: R2Bucket;
  SESSIONS?: KVNamespace;
  SYNC_QUEUE?: Queue;
}
