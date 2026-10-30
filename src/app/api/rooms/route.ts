import { NextResponse } from "next/server";
import { listRooms } from "@/lib/repo";

export const dynamic = "force-dynamic";

// Rooms (with latest exec/verif) from Cloudflare D1.
export async function GET() {
  try {
    const rooms = await listRooms();
    return NextResponse.json({ ok: true, rooms });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
