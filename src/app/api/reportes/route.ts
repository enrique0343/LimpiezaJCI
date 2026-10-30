import { NextResponse } from "next/server";
import { listRooms } from "@/lib/repo";
import { computeMetrics, type MetricsRoom } from "@/lib/metrics";
import { PROTOCOLS } from "@/lib/seed";
import type { ProtocolKey } from "@/domain/types";

export const dynamic = "force-dynamic";

const EST: Record<ProtocolKey, number> = {
  rutina: PROTOCOLS.rutina.estMin,
  terminal: PROTOCOLS.terminal.estMin,
  aislamiento: PROTOCOLS.aislamiento.estMin,
  altoriesgo: PROTOCOLS.altoriesgo.estMin,
};

// Aggregated indicators (spec §8.6), computed server-side from D1.
export async function GET() {
  try {
    const rooms = await listRooms();
    const mapped: MetricsRoom[] = rooms.map((r) => ({
      id: r.id,
      state: r.state,
      highRisk: r.highRisk,
      execRecord: r.execRecord
        ? {
            protoKey: r.execRecord.protoKey,
            startedAt: r.execRecord.startedAt,
            finishedAt: r.execRecord.finishedAt,
            enteredAt: r.execRecord.enteredAt,
            exitedAt: r.execRecord.exitedAt,
          }
        : undefined,
      verifRecord: r.verifRecord
        ? {
            late: r.verifRecord.late,
            decision: r.verifRecord.decision,
            conformidad: r.verifRecord.conformidad,
            results: r.verifRecord.results as Record<
              string,
              { estado: string; severity?: string }
            >,
          }
        : undefined,
      releasedAt: r.releasedAt,
    }));
    return NextResponse.json({ ok: true, metrics: computeMetrics(mapped, EST) });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
