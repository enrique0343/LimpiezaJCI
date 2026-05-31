// Server-only data access for Cloudflare D1 (via getPrisma). Enforces the §9
// rules through src/domain and writes the append-only audit log. Imported only
// from API route handlers (never from client components).
import { getPrisma } from "./db";
import {
  dbRoomToClient,
  buildExecutionAuditEvents,
  buildVerificationAuditEvents,
  type DbRoomRow,
} from "./map";
import {
  createAuditEvent,
  decideVerification,
  isVerificationLate,
  canRelease,
  assertCanVerify,
  type AuditEventInput,
} from "@/domain";
import type { ProtocolKey, Severity, UserRole } from "@/domain/types";
import type { Room, VerifResult } from "./types";

function auditCreateData(input: AuditEventInput) {
  const e = createAuditEvent(input, new Date());
  return {
    ts: e.ts,
    roomId: e.roomId,
    actorId: e.actorId,
    isSystem: e.isSystem,
    type: e.type,
    detail: e.detail,
    prevEventId: e.prevEventId,
  };
}

/** All non-deleted rooms with their latest execution and verification. */
export async function listRooms(): Promise<Room[]> {
  const db = getPrisma();
  const rows = await db.room.findMany({
    where: { deletedAt: null },
    include: {
      executions: { orderBy: { startedAt: "desc" }, take: 1 },
      verifications: { orderBy: { startedAt: "desc" }, take: 1 },
    },
    orderBy: { id: "asc" },
  });
  return rows.map((r) => dbRoomToClient(r as unknown as DbRoomRow));
}

export interface PersistExecutionInput {
  roomId: string;
  operatorId: string;
  protocolCode: string;
  protocolVersion: string;
  motivo: string;
  qrScannedAt: number;
  startedAt: number;
  finishedAt: number;
  stepsConfirmed: { idx: number; at: number }[];
  insumos: string[];
  photos: Record<number, string>;
  incidents: { stepIdx: number; text: string; at: number }[];
}

/** Persist a finished execution → record + room state + audit (spec §8.3, §9). */
export async function persistExecution(input: PersistExecutionInput) {
  const db = getPrisma();
  const execId = crypto.randomUUID();
  const events = buildExecutionAuditEvents(input);
  await db.$transaction([
    db.executionRecord.create({
      data: {
        id: execId,
        roomId: input.roomId,
        operatorId: input.operatorId,
        protocolCode: input.protocolCode,
        protocolVersion: input.protocolVersion,
        motivo: input.motivo,
        qrScannedAt: new Date(input.qrScannedAt),
        startedAt: new Date(input.startedAt),
        finishedAt: new Date(input.finishedAt),
        stepsConfirmed: input.stepsConfirmed,
        insumos: input.insumos,
        photos: input.photos,
        incidents: input.incidents,
      },
    }),
    db.room.update({
      where: { id: input.roomId },
      data: { state: "pend_verificacion" },
    }),
    ...events.map((e) => db.auditEvent.create({ data: auditCreateData(e) })),
  ]);
  return { executionRecordId: execId };
}

export interface PersistVerificationInput {
  roomId: string;
  executionRecordId: string;
  verifierId: string;
  verifierRole: UserRole;
  startedAt: number;
  results: Record<string, VerifResult>;
}

/**
 * Persist a finished verification → record + room state + audit (spec §8.4, §9).
 * Enforces role separation (§9.3) and PCI-only release for high risk (§9.6).
 */
export async function persistVerification(input: PersistVerificationInput) {
  const db = getPrisma();
  const room = await db.room.findUnique({
    where: { id: input.roomId },
    include: { executions: { orderBy: { startedAt: "desc" }, take: 1 } },
  });
  if (!room) throw new Error("Room not found");
  const exec = room.executions[0];
  if (!exec) throw new Error("No execution to verify");

  // §9.3 role separation.
  assertCanVerify({ operatorId: exec.operatorId }, input.verifierId);

  const protocolKey = (exec.protocolCode.endsWith("001")
    ? "rutina"
    : exec.protocolCode.endsWith("002")
      ? "terminal"
      : exec.protocolCode.endsWith("003")
        ? "aislamiento"
        : "altoriesgo") as ProtocolKey;

  const results = Object.values(input.results);
  const conf = results.filter((r) => r.estado === "conforme").length;
  const noConf = results.filter((r) => r.estado === "no_conforme").length;
  const denom = conf + noConf;
  const conformidad = denom === 0 ? 0 : Math.round((conf / denom) * 100);
  const hasCriticalFinding = results.some(
    (r) => r.estado === "no_conforme" && (r.severity as Severity) === "critico",
  );
  const decision = decideVerification({
    protocolKey,
    conformidadPct: conformidad,
    hasCriticalFinding,
    highRisk: room.highRisk,
  });
  const late = exec.finishedAt
    ? isVerificationLate({
        protocolKey,
        execFinishedAt: exec.finishedAt,
        verifStartedAt: new Date(input.startedAt),
      })
    : false;

  // §9.6 PCI-only release for high risk.
  if (decision === "liberada" && !canRelease(room, input.verifierRole)) {
    const err = new Error(
      "Habitación de alto riesgo: solo el Verificador PCI puede liberar.",
    );
    err.name = "ReleaseForbidden";
    throw err;
  }

  const now = new Date();
  const nextState = decision === "liberada" ? "liberada" : "con_hallazgos";
  const events = buildVerificationAuditEvents({
    roomId: input.roomId,
    verifierId: input.verifierId,
    conformidad,
    late,
    decision,
  });

  await db.$transaction([
    db.verificationRecord.create({
      data: {
        roomId: input.roomId,
        executionRecordId: input.executionRecordId || exec.id,
        verifierId: input.verifierId,
        startedAt: new Date(input.startedAt),
        finishedAt: now,
        // Round-trip to plain JSON (drops undefined optional fields).
        results: JSON.parse(JSON.stringify(input.results)),
        conformidadPct: conformidad,
        late,
        decision,
        decisionAt: now,
      },
    }),
    db.room.update({
      where: { id: input.roomId },
      data: {
        state: nextState,
        lastReleaseAt: decision === "liberada" ? now : undefined,
      },
    }),
    ...events.map((e) => db.auditEvent.create({ data: auditCreateData(e) })),
  ]);

  return { decision, conformidad, late };
}

/** Append-only audit events for a room, oldest first. */
export async function listAudit(roomId: string) {
  const db = getPrisma();
  const rows = await db.auditEvent.findMany({
    where: { roomId },
    orderBy: { ts: "asc" },
  });
  return rows.map((e) => ({
    id: e.id,
    ts: e.ts.getTime(),
    type: e.type,
    detail: e.detail,
    actorId: e.actorId ?? "system",
    isSystem: e.isSystem,
    roomId: e.roomId ?? undefined,
  }));
}
