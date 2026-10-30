import type { AuditEventType } from "./types";

export const SYSTEM_ACTOR = "system" as const;

export interface AuditEventInput {
  type: AuditEventType;
  detail: string;
  /** Authenticated actor id. Required unless `isSystem` is true (rule §9.1). */
  actorId?: string | null;
  /** System-generated event (notifications, session expiry). Sets actor to 'system'. */
  isSystem?: boolean;
  roomId?: string;
  payload?: Record<string, unknown>;
  /** For corrections: id of the event being corrected (rule §9.7). */
  prevEventId?: string;
}

export interface AuditEvent {
  ts: Date;
  type: AuditEventType;
  detail: string;
  actorId: string;
  isSystem: boolean;
  roomId?: string;
  payload?: Record<string, unknown>;
  prevEventId?: string;
}

export class AuditError extends Error {
  constructor(
    message: string,
    readonly rule: string,
  ) {
    super(message);
    this.name = "AuditError";
  }
}

/**
 * Build an audit event with the non-negotiable guarantees of spec §9:
 *  - §9.1 No anonymous events: a non-null actorId is required; system events
 *    must opt in via `isSystem` and are attributed to {@link SYSTEM_ACTOR}.
 *  - §9.2 No editable timestamps: the timestamp is set here from a server clock
 *    (`now`, defaulting to the current time) — never taken from the client.
 *  - §9.7 Append-only: corrections are new events carrying `prevEventId`; the
 *    storage layer must reject updates to existing events.
 */
export function createAuditEvent(
  input: AuditEventInput,
  now: Date = new Date(),
): AuditEvent {
  let actorId: string;
  if (input.isSystem) {
    actorId = SYSTEM_ACTOR;
  } else {
    if (!input.actorId) {
      throw new AuditError(
        "Every audit event needs a non-null actorId (no anonymous events).",
        "§9.1",
      );
    }
    actorId = input.actorId;
  }

  return {
    ts: now,
    type: input.type,
    detail: input.detail,
    actorId,
    isSystem: input.isSystem ?? false,
    ...(input.roomId !== undefined ? { roomId: input.roomId } : {}),
    ...(input.payload !== undefined ? { payload: input.payload } : {}),
    ...(input.prevEventId !== undefined
      ? { prevEventId: input.prevEventId }
      : {}),
  };
}
