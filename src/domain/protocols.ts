import type { ProtocolKey } from "./types";

// Default protocol suggestion by cleaning motive (spec §6.5). UCI/quirófano
// (high-risk rooms) always suggest the high-risk protocol regardless of motive.
const MOTIVO_TO_PROTOCOL: Readonly<Record<string, ProtocolKey>> = {
  "limpieza rutinaria diaria": "rutina",
  "alta de paciente": "terminal",
  "post-alta aislamiento infeccioso": "aislamiento",
};

export interface SuggestProtocolOptions {
  /** UCI / quirófano / etc. — forces the high-risk protocol (spec §6.5). */
  highRisk?: boolean;
}

/**
 * Suggest the default protocol for a given motive. The operator can override it
 * later, but that override must be logged with a justification (spec §8.3 / §9
 * via the `protocol_changed` audit event). Returns `undefined` when no default
 * matches and the room is not high-risk.
 */
export function suggestProtocol(
  motivo: string,
  opts: SuggestProtocolOptions = {},
): ProtocolKey | undefined {
  if (opts.highRisk) return "altoriesgo";
  return MOTIVO_TO_PROTOCOL[motivo.trim().toLowerCase()];
}
