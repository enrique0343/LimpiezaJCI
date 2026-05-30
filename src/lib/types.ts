// Runtime (in-memory / demo) types for the operational flow. These mirror the
// Prisma domain (prisma/schema.prisma, spec §7) but are plain objects so the
// demo runs with seed data and no live database. Swap to Prisma later behind
// the same shapes. Timestamps are epoch ms.
import type { ProtocolKey, RoomState, Severity, UserRole } from "@/domain/types";

export interface AppUser {
  id: string;
  fullName: string;
  initials: string;
  code: string;
  role: UserRole;
  area: string;
}

export interface Protocol {
  key: ProtocolKey;
  name: string;
  code: string;
  version: string;
  norm: string;
  desc: string;
  estTime: string;
  photoReq: boolean;
  photoSlots: string[];
  steps: string[];
}

export interface Insumo {
  gtin: string;
  name: string;
  lot: string;
  dil: string;
  tipo: "desinfectante" | "limpiador" | "epp" | "otro";
}

export interface VerifItem {
  id: string;
  t: "L" | "M";
  l: string;
}

export interface VerifArea {
  area: string;
  items: VerifItem[];
}

export interface StepConfirm {
  idx: number;
  at: number;
}

export interface Incident {
  stepIdx: number;
  text: string;
  at: number;
}

export interface ExecRecord {
  id: string;
  operatorId: string;
  protoKey: ProtocolKey;
  protocolCode: string;
  protocolVersion: string;
  motivo: string;
  qrScannedAt: number;
  startedAt: number;
  finishedAt?: number;
  stepsConfirmed: StepConfirm[];
  insumos: string[];
  photos: Record<number, string>;
  incidents: Incident[];
}

export type VerifEstado = "conforme" | "no_conforme" | "na";

export interface VerifResult {
  estado: VerifEstado;
  severity?: Severity;
  note?: string;
}

export interface VerifRecord {
  id: string;
  verifierId: string;
  startedAt: number;
  finishedAt?: number;
  results: Record<string, VerifResult>;
  conformidad: number;
  late: boolean;
  decision?: "liberada" | "devuelta";
}

export interface Room {
  id: string;
  tipo: string;
  piso: string;
  state: RoomState;
  motivo: string;
  suggestedProto?: ProtocolKey;
  highRisk: boolean;
  qrCode: string;
  execRecord?: ExecRecord;
  verifRecord?: VerifRecord;
  releasedAt?: number;
}

export interface StoredAuditEvent {
  id: string;
  ts: number;
  type: string;
  detail: string;
  actorId: string;
  isSystem: boolean;
  roomId?: string;
  prevEventId?: string;
  payload?: Record<string, unknown>;
}
