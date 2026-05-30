import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

// Health check that exercises the Cloudflare D1 binding end-to-end: it counts
// the seeded domain rows. Runs on the Worker at request time (never prerendered).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getPrisma();
    const [rooms, users, protocols, insumos] = await Promise.all([
      db.room.count(),
      db.user.count(),
      db.protocol.count(),
      db.insumo.count(),
    ]);
    return NextResponse.json({
      ok: true,
      db: "cloudflare-d1",
      counts: { rooms, users, protocols, insumos },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
