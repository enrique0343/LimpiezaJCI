// Pure mappers between the D1/Prisma row shapes and the client runtime types,
// plus builders that expand a persisted record into its append-only audit
// events. Pure and framework-free so they can be unit-tested without a DB.
import type { ProtocolKey, RoomState } from "@/domain/types";
import type { AuditEventInput } from "@/domain";
import type { Room } from "./types";

export interface DbExecRow {
  id: string;
  operatorId: string;
  protocolCode: string;
  protocolVersion: string;
  motivo: string;
  qrScannedAt: Date;
  startedAt: Date;
  finishedAt: Date | null;
  stepsConfirmed: unknown;
  insumos: unknown;
  photos: unknown;
  incidents: unknown;
}

export interface DbVerifRow {
  id: string;
  verifierId: string;
  startedAt: Date;
  finishedAt: Date | null;
  results: unknown;
  conformidadPct: number;
  late: boolean;
  decision: string | null;
}

export interface DbRoomRow {
  id: string;
  tipo: string;
  piso: string;
  state: string;
  motivo: string | null;
  suggestedProtocolKey: string | null;
  highRisk: boolean;
  qrCode: string;
  lastReleaseAt: Date | null;
  executions?: DbExecRow[];
  verifications?: DbVerifRow[];
}

function asArray<T = unknown>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? (p as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Map a D1 Room row (with its latest exec/verif) to the client Room shape. */
export function dbRoomToClient(row: DbRoomRow): Room {
  const exec = row.executions?.[0];
  const verif = row.verifications?.[0];
  return {
    id: row.id,
    tipo: row.tipo,
    piso: row.piso,
    state: row.state as RoomState,
    motivo: row.motivo ?? "",
    suggestedProto: (row.suggestedProtocolKey as ProtocolKey | null) ?? undefined,
    highRisk: row.highRisk,
    qrCode: row.qrCode,
    releasedAt: row.lastReleaseAt ? row.lastReleaseAt.getTime() : undefined,
    execRecord: exec
      ? {
          id: exec.id,
          operatorId: exec.operatorId,
          protoKey: (exec.protocolCode.endsWith("001")
            ? "rutina"
            : exec.protocolCode.endsWith("002")
              ? "terminal"
              : exec.protocolCode.endsWith("003")
                ? "aislamiento"
                : "altoriesgo") as ProtocolKey,
          protocolCode: exec.protocolCode,
          protocolVersion: exec.protocolVersion,
          motivo: exec.motivo,
          qrScannedAt: exec.qrScannedAt.getTime(),
          startedAt: exec.startedAt.getTime(),
          finishedAt: exec.finishedAt ? exec.finishedAt.getTime() : undefined,
          stepsConfirmed: asArray(exec.stepsConfirmed),
          insumos: asArray<string>(exec.insumos),
          photos: (typeof exec.photos === "object" && exec.photos
            ? (exec.photos as Record<number, string>)
            : {}) as Record<number, string>,
          incidents: asArray(exec.incidents),
        }
      : undefined,
    verifRecord: verif
      ? {
          id: verif.id,
          verifierId: verif.verifierId,
          startedAt: verif.startedAt.getTime(),
          finishedAt: verif.finishedAt ? verif.finishedAt.getTime() : undefined,
          results: (typeof verif.results === "object" && verif.results
            ? (verif.results as Record<string, never>)
            : {}) as Record<string, never>,
          conformidad: verif.conformidadPct,
          late: verif.late,
          decision: (verif.decision as "liberada" | "devuelta" | null) ?? undefined,
        }
      : undefined,
  };
}

export interface ExecutionLike {
  roomId: string;
  operatorId: string;
  protocolCode: string;
  protocolVersion: string;
  stepsConfirmed: { idx: number }[];
  photos: Record<number, string>;
  insumos: string[];
  incidents: { stepIdx: number }[];
}

/**
 * Expand a finished execution into its append-only audit events (spec §9).
 * A full terminal cycle yields ≥15 events (acceptance §14). Every event carries
 * the operator as actor and the room id; timestamps are stamped server-side by
 * the audit factory at persist time.
 */
export function buildExecutionAuditEvents(e: ExecutionLike): AuditEventInput[] {
  const a = e.operatorId;
  const r = e.roomId;
  const ev: AuditEventInput[] = [
    { type: "qr_scan", detail: `Escaneo QR Hab. ${r}`, actorId: a, roomId: r },
    { type: "exec_open", detail: "Apertura de registro de ejecución", actorId: a, roomId: r },
    { type: "protocol_selected", detail: `Protocolo ${e.protocolCode} ${e.protocolVersion}`, actorId: a, roomId: r },
    { type: "insumos_selected", detail: `${e.insumos.length} insumo(s) seleccionados`, actorId: a, roomId: r },
    { type: "exec_start", detail: `Inicio de ejecución · ${e.protocolCode} ${e.protocolVersion}`, actorId: a, roomId: r },
  ];
  for (const s of e.stepsConfirmed) {
    ev.push({ type: "step_confirm", detail: `Paso ${s.idx + 1} confirmado`, actorId: a, roomId: r });
  }
  for (const inc of e.incidents) {
    ev.push({ type: "incident", detail: `Incidente (paso ${inc.stepIdx + 1})`, actorId: a, roomId: r });
  }
  for (const k of Object.keys(e.photos)) {
    ev.push({ type: "photo", detail: `Foto capturada (slot ${k})`, actorId: a, roomId: r });
  }
  ev.push({ type: "exec_finish", detail: "Cierre de ejecución", actorId: a, roomId: r });
  ev.push({ type: "room_state_change", detail: "en_limpieza → pend_verificacion", actorId: a, roomId: r });
  return ev;
}

/** Expand a finished verification into its audit events (§8.4, §9). */
export function buildVerificationAuditEvents(input: {
  roomId: string;
  verifierId: string;
  conformidad: number;
  late: boolean;
  decision: "liberada" | "devuelta";
}): AuditEventInput[] {
  const { roomId: r, verifierId: a } = input;
  const ev: AuditEventInput[] = [
    { type: "verif_open", detail: "Apertura de registro de verificación", actorId: a, roomId: r },
    { type: "verif_finish", detail: `Verificación cerrada · ${input.conformidad}% conformidad${input.late ? " · tardía" : ""}`, actorId: a, roomId: r },
  ];
  if (input.decision === "liberada") {
    ev.push({ type: "release", detail: "Habitación liberada para admisión", actorId: a, roomId: r });
    ev.push({ type: "room_state_change", detail: "pend_verificacion → liberada", actorId: a, roomId: r });
  } else {
    ev.push({ type: "return_for_correction", detail: "Devuelta para corrección", actorId: a, roomId: r });
    ev.push({ type: "room_state_change", detail: "pend_verificacion → con_hallazgos", actorId: a, roomId: r });
  }
  return ev;
}
