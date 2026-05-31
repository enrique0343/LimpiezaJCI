import { NextResponse } from "next/server";
import { z } from "zod";
import { persistExecution } from "@/lib/repo";

export const dynamic = "force-dynamic";

const schema = z.object({
  roomId: z.string(),
  operatorId: z.string(),
  protocolCode: z.string(),
  protocolVersion: z.string(),
  motivo: z.string(),
  qrScannedAt: z.number(),
  startedAt: z.number(),
  finishedAt: z.number(),
  stepsConfirmed: z.array(z.object({ idx: z.number(), at: z.number() })),
  insumos: z.array(z.string()),
  photos: z.record(z.string(), z.string()),
  incidents: z.array(
    z.object({ stepIdx: z.number(), text: z.string(), at: z.number() }),
  ),
});

// Persist a finished execution to D1 (record + room state + audit, §8.3/§9).
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
  try {
    const photos = Object.fromEntries(
      Object.entries(parsed.data.photos).map(([k, v]) => [Number(k), v]),
    );
    const result = await persistExecution({ ...parsed.data, photos });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
