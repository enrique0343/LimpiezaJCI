import { NextResponse } from "next/server";
import { z } from "zod";
import { persistVerification } from "@/lib/repo";
import { BusinessRuleError } from "@/domain";

export const dynamic = "force-dynamic";

const schema = z.object({
  roomId: z.string(),
  executionRecordId: z.string().optional().default(""),
  verifierId: z.string(),
  verifierRole: z.enum(["operador", "supervisor", "pci", "gerencia"]),
  startedAt: z.number(),
  results: z.record(
    z.string(),
    z.object({
      estado: z.enum(["conforme", "no_conforme", "na"]),
      severity: z.enum(["menor", "mayor", "critico"]).optional(),
      note: z.string().optional(),
    }),
  ),
});

// Persist a finished verification to D1, enforcing §9.3 (role separation) and
// §9.6 (PCI-only release for high risk).
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
  try {
    const result = await persistVerification(parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof Error && err.name === "ReleaseForbidden") {
      return NextResponse.json({ ok: false, error: err.message }, { status: 403 });
    }
    if (err instanceof BusinessRuleError) {
      return NextResponse.json(
        { ok: false, error: err.message, rule: err.rule },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
