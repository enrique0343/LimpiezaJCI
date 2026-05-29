import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Build a PrismaClient for the current request, talking to PostgreSQL through
 * the Cloudflare Hyperdrive binding (connection pooling/acceleration).
 *
 * The Workers runtime is `workerd` (not Node) and is request-scoped, so we
 * create the client per invocation rather than as a long-lived singleton.
 *
 * Locally, `wrangler dev` / `next dev` (with initOpenNextCloudflareForDev)
 * expose env.HYPERDRIVE.connectionString. If the binding is not yet
 * provisioned, fall back to DATABASE_URL so the app still boots in plain
 * `next dev`.
 */
export function getPrisma(): PrismaClient {
  const { env } = getCloudflareContext();
  const connectionString =
    env.HYPERDRIVE?.connectionString ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "No database connection string: provision the HYPERDRIVE binding (wrangler.jsonc) or set DATABASE_URL.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
