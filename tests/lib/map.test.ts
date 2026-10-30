import { describe, it, expect } from "vitest";
import {
  buildExecutionAuditEvents,
  buildVerificationAuditEvents,
} from "@/lib/map";

describe("buildExecutionAuditEvents (§9 / §14)", () => {
  const terminal = {
    roomId: "201",
    operatorId: "u1",
    protocolCode: "PNT-LIM-002",
    protocolVersion: "v1.3",
    stepsConfirmed: Array.from({ length: 12 }, (_, i) => ({ idx: i })),
    photos: { 0: "x", 1: "y", 2: "z" },
    insumos: ["g1", "g2"],
    incidents: [],
  };

  it("emits ≥15 events for a full terminal cycle (acceptance §14)", () => {
    const ev = buildExecutionAuditEvents(terminal);
    expect(ev.length).toBeGreaterThanOrEqual(15);
  });

  it("every event carries a non-null actor and the room id (§9.1)", () => {
    const ev = buildExecutionAuditEvents(terminal);
    expect(ev.every((e) => e.actorId === "u1" && e.roomId === "201")).toBe(true);
  });

  it("includes open, start, finish and a state change in order", () => {
    const types = buildExecutionAuditEvents(terminal).map((e) => e.type);
    expect(types[0]).toBe("qr_scan");
    expect(types).toContain("exec_start");
    expect(types).toContain("exec_finish");
    expect(types.at(-1)).toBe("room_state_change");
    expect(types.filter((t) => t === "step_confirm")).toHaveLength(12);
    expect(types.filter((t) => t === "photo")).toHaveLength(3);
  });
});

describe("buildVerificationAuditEvents (§8.4)", () => {
  it("emits release + state change when liberada", () => {
    const types = buildVerificationAuditEvents({
      roomId: "201",
      verifierId: "u3",
      conformidad: 100,
      late: false,
      decision: "liberada",
    }).map((e) => e.type);
    expect(types).toEqual([
      "verif_open",
      "verif_finish",
      "release",
      "room_state_change",
    ]);
  });

  it("emits return_for_correction when devuelta", () => {
    const types = buildVerificationAuditEvents({
      roomId: "201",
      verifierId: "u3",
      conformidad: 60,
      late: true,
      decision: "devuelta",
    }).map((e) => e.type);
    expect(types).toContain("return_for_correction");
    expect(types).not.toContain("release");
  });
});
