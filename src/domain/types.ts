// Domain types for LimpiezaJCI, mirroring spec §7. These are intentionally
// plain string-literal unions (not Prisma enums) so the domain rules stay
// pure and testable without a database or generated client.

export type UserRole = "operador" | "supervisor" | "pci" | "gerencia";

export type RoomState =
  | "pendiente"
  | "en_limpieza"
  | "pend_verificacion"
  | "con_hallazgos"
  | "liberada";

export type ProtocolKey = "rutina" | "terminal" | "aislamiento" | "altoriesgo";

export type Severity = "menor" | "mayor" | "critico";

export type AuditEventType =
  | "login"
  | "logout"
  | "exec_open"
  | "qr_scan"
  | "protocol_selected"
  | "insumos_selected"
  | "exec_start"
  | "step_confirm"
  | "incident"
  | "photo"
  | "exec_finish"
  | "exec_cancel"
  | "verif_open"
  | "verif_finish"
  | "release"
  | "return_for_correction"
  | "protocol_changed"
  | "room_state_change"
  | "sync_conflict";

/** The high-risk protocols that require PCI release (spec §6.3, §6.4, §9.6). */
export const HIGH_RISK_PROTOCOLS: readonly ProtocolKey[] = [
  "aislamiento",
  "altoriesgo",
];
