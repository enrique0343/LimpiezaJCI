import { HIGH_RISK_PROTOCOLS, type ProtocolKey, type UserRole } from "./types";

export class BusinessRuleError extends Error {
  constructor(
    message: string,
    /** Spec rule reference, e.g. "§9.3". */
    readonly rule: string,
  ) {
    super(message);
    this.name = "BusinessRuleError";
  }
}

/** A room is high-risk if flagged as such or cleaned under a high-risk protocol. */
export function isHighRisk(input: {
  highRisk?: boolean;
  protocolKey?: ProtocolKey;
}): boolean {
  if (input.highRisk) return true;
  return input.protocolKey
    ? HIGH_RISK_PROTOCOLS.includes(input.protocolKey)
    : false;
}

/**
 * Rule §9.3 — mandatory role separation. The operator who closed an execution
 * cannot verify that same execution. Throws {@link BusinessRuleError} when the
 * verifier is the same person as the operator.
 */
export function assertCanVerify(execution: {
  operatorId: string;
}, verifierId: string): void {
  if (execution.operatorId === verifierId) {
    throw new BusinessRuleError(
      "The operator who closed an execution cannot verify it (role separation).",
      "§9.3",
    );
  }
}

/**
 * Rule §9.6 — PCI release required for high risk. High-risk rooms/protocols can
 * only be released by the `pci` role; the SG supervisor has no release button.
 * Returns whether the actor may release; never throws.
 */
export function canRelease(
  room: { highRisk?: boolean; protocolKey?: ProtocolKey },
  actorRole: UserRole,
): boolean {
  if (isHighRisk(room)) return actorRole === "pci";
  return actorRole === "supervisor" || actorRole === "pci";
}

/** Asserting variant of {@link canRelease}. */
export function assertCanRelease(
  room: { highRisk?: boolean; protocolKey?: ProtocolKey },
  actorRole: UserRole,
): void {
  if (!canRelease(room, actorRole)) {
    const why = isHighRisk(room)
      ? "high-risk rooms can only be released by the 'pci' role"
      : "release requires the 'supervisor' or 'pci' role";
    throw new BusinessRuleError(`Cannot release: ${why}.`, "§9.6");
  }
}

// Default conformity thresholds for release (spec §8.4 step 3), configurable by
// admin. Values are percentages (0–100).
export const DEFAULT_CONFORMITY_THRESHOLDS: Readonly<
  Record<ProtocolKey, number>
> = {
  altoriesgo: 100,
  aislamiento: 100,
  terminal: 95,
  rutina: 90,
};

export interface VerificationDecisionInput {
  protocolKey: ProtocolKey;
  conformidadPct: number;
  hasCriticalFinding: boolean;
  highRisk?: boolean;
  thresholds?: Partial<Record<ProtocolKey, number>>;
}

/**
 * Decide a verification outcome (spec §8.4 step 3): a room is `liberada` only
 * when conformity meets the protocol threshold AND there are no critical
 * findings; otherwise it is `devuelta` (returns to `con_hallazgos`). High-risk
 * rooms always use the 100% threshold.
 */
export function decideVerification(
  input: VerificationDecisionInput,
): "liberada" | "devuelta" {
  if (input.hasCriticalFinding) return "devuelta";
  const base = {
    ...DEFAULT_CONFORMITY_THRESHOLDS,
    ...input.thresholds,
  };
  const threshold = isHighRisk(input) ? 100 : base[input.protocolKey];
  return input.conformidadPct >= threshold ? "liberada" : "devuelta";
}

// Verification window before a verification is flagged "tardía" (spec §5).
// 30 min for terminal protocols, 2 h for routine. Configurable by admin.
export const VERIFICATION_WINDOW_MINUTES: Readonly<Record<ProtocolKey, number>> =
  {
    rutina: 120,
    terminal: 30,
    aislamiento: 30,
    altoriesgo: 30,
  };

/**
 * Whether a verification started late (spec §5). Being late never invalidates
 * the verification — it only sets a flag that surfaces in aggregate reports.
 */
export function isVerificationLate(input: {
  protocolKey: ProtocolKey;
  execFinishedAt: Date;
  verifStartedAt: Date;
  windowMinutes?: number;
}): boolean {
  const windowMs =
    (input.windowMinutes ?? VERIFICATION_WINDOW_MINUTES[input.protocolKey]) *
    60_000;
  return (
    input.verifStartedAt.getTime() - input.execFinishedAt.getTime() > windowMs
  );
}
