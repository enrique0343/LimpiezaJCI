import type { RoomState, UserRole } from "./types";

// Room state machine (spec §5). Only these transitions are allowed without a
// privileged override.
//
//   pendiente        → en_limpieza        (iniciar ejecución)
//   en_limpieza       → pend_verificacion  (finalizar ejecución)
//   en_limpieza       → pendiente          (cancelar ejecución, §7 exec_cancel)
//   pend_verificacion → liberada           (verificar: conforme)
//   pend_verificacion → con_hallazgos      (verificar: hallazgos)
//   con_hallazgos     → pendiente          (iniciar corrección → reejecutar)
//   liberada          → pendiente          (próxima alta / rutina diaria)
const ALLOWED: Readonly<Record<RoomState, readonly RoomState[]>> = {
  pendiente: ["en_limpieza"],
  en_limpieza: ["pend_verificacion", "pendiente"],
  pend_verificacion: ["liberada", "con_hallazgos"],
  con_hallazgos: ["pendiente"],
  liberada: ["pendiente"],
};

/** True when `to` is a canonical transition from `from` (spec §5 diagram). */
export function canTransition(from: RoomState, to: RoomState): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export interface TransitionContext {
  /** Role of the actor performing the transition. */
  actorRole: UserRole;
  /** Required when forcing a transition outside the §5 diagram. */
  justification?: string;
}

export class StateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateTransitionError";
  }
}

/**
 * Assert a room state transition is permitted.
 *
 * Canonical transitions (spec §5) are always allowed. Any transition outside
 * the diagram is an "arbitrary regression" (rule §9.4): it requires the
 * `gerencia` role AND a non-empty justification, and the caller must record an
 * audit event for it. Throws {@link StateTransitionError} otherwise.
 */
export function assertTransition(
  from: RoomState,
  to: RoomState,
  ctx: TransitionContext,
): void {
  if (from === to) {
    throw new StateTransitionError(`No-op transition: already in '${from}'.`);
  }
  if (canTransition(from, to)) return;

  if (ctx.actorRole !== "gerencia") {
    throw new StateTransitionError(
      `Transition '${from}' → '${to}' is outside the §5 diagram and requires the 'gerencia' role.`,
    );
  }
  if (!ctx.justification || ctx.justification.trim() === "") {
    throw new StateTransitionError(
      `Forced transition '${from}' → '${to}' requires a justification (rule §9.4).`,
    );
  }
}
