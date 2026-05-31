import { NextResponse } from "next/server";
import { listAudit } from "@/lib/repo";

export const dynamic = "force-dynamic";

// Append-only audit timeline for a room (spec §8.5), read from D1.
export async function GET(req: Request) {
  const roomId = new URL(req.url).searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ ok: false, error: "roomId required" }, { status: 400 });
  }
  try {
    const events = await listAudit(roomId);
    return NextResponse.json({ ok: true, events });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
