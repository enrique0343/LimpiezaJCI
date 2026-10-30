import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Build a PrismaClient for the current request, talking to the Cloudflare D1
 * database through the `DB` binding (see wrangler.jsonc).
 *
 * The Workers runtime is `workerd` (not Node) and request-scoped, so the client
 * is created per invocation rather than as a long-lived singleton.
 */
export function getPrisma(): PrismaClient {
  const { env } = getCloudflareContext();
  if (!env.DB) {
    throw new Error(
      "Missing D1 binding 'DB'. Configure d1_databases in wrangler.jsonc.",
    );
  }
  const adapter = new PrismaD1(env.DB);
  return new PrismaClient({ adapter });
}
