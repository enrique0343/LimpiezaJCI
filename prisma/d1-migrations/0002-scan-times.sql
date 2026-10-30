-- D1 migration 0002 — scan-in/scan-out times (DataMatrix entry/exit).
-- Apply to the live D1 (schema 0001 already applied) before deploying the
-- DataMatrix flow. Via Wrangler:
--   wrangler d1 execute limpieza-jci-db --remote --file=prisma/d1-migrations/0002-scan-times.sql
-- or paste in the Cloudflare D1 dashboard console.

ALTER TABLE "ExecutionRecord" ADD COLUMN "enteredAt" DATETIME;
ALTER TABLE "ExecutionRecord" ADD COLUMN "exitedAt" DATETIME;
