import { describe, it, expect } from "vitest";
import { createAuditEvent, AuditError, SYSTEM_ACTOR } from "@/domain/audit";

describe("audit event factory (§9)", () => {
  it("rejects anonymous events (§9.1)", () => {
    expect(() =>
      createAuditEvent({ type: "login", detail: "x", actorId: null }),
    ).toThrow(AuditError);
    expect(() => createAuditEvent({ type: "login", detail: "x" })).toThrow(
      /actorId/,
    );
  });

  it("attributes system events to the system actor", () => {
    const ev = createAuditEvent({
      type: "logout",
      detail: "session expired",
      isSystem: true,
    });
    expect(ev.actorId).toBe(SYSTEM_ACTOR);
    expect(ev.isSystem).toBe(true);
  });

  it("uses the server clock, never the client (§9.2)", () => {
    const now = new Date("2026-05-29T10:00:00Z");
    const ev = createAuditEvent(
      { type: "exec_start", detail: "Hab 201", actorId: "u1" },
      now,
    );
    expect(ev.ts).toBe(now);
  });

  it("carries prevEventId for corrections (§9.7)", () => {
    const ev = createAuditEvent({
      type: "room_state_change",
      detail: "corrección",
      actorId: "u4",
      prevEventId: "evt_123",
      roomId: "201",
      payload: { reason: "typo" },
    });
    expect(ev.prevEventId).toBe("evt_123");
    expect(ev.roomId).toBe("201");
    expect(ev.payload).toEqual({ reason: "typo" });
    expect(ev.isSystem).toBe(false);
  });

  it("omits optional fields when not provided", () => {
    const ev = createAuditEvent({
      type: "qr_scan",
      detail: "scan",
      actorId: "u1",
    });
    expect(ev).not.toHaveProperty("roomId");
    expect(ev).not.toHaveProperty("payload");
    expect(ev).not.toHaveProperty("prevEventId");
  });
});
