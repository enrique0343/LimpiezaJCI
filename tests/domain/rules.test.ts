import { describe, it, expect } from "vitest";
import {
  assertCanVerify,
  canRelease,
  assertCanRelease,
  decideVerification,
  isHighRisk,
  isVerificationLate,
  BusinessRuleError,
} from "@/domain/rules";

describe("role separation (§9.3)", () => {
  it("rejects the operator verifying their own execution", () => {
    expect(() => assertCanVerify({ operatorId: "u1" }, "u1")).toThrow(
      BusinessRuleError,
    );
  });

  it("allows a different verifier", () => {
    expect(() => assertCanVerify({ operatorId: "u1" }, "u3")).not.toThrow();
  });
});

describe("high-risk detection", () => {
  it("is true when flagged", () => {
    expect(isHighRisk({ highRisk: true })).toBe(true);
  });
  it("is true for aislamiento / altoriesgo protocols", () => {
    expect(isHighRisk({ protocolKey: "aislamiento" })).toBe(true);
    expect(isHighRisk({ protocolKey: "altoriesgo" })).toBe(true);
  });
  it("is false for routine/terminal without flag", () => {
    expect(isHighRisk({ protocolKey: "rutina" })).toBe(false);
    expect(isHighRisk({})).toBe(false);
  });
});

describe("PCI release (§9.6)", () => {
  it("only PCI can release high-risk rooms", () => {
    expect(canRelease({ highRisk: true }, "supervisor")).toBe(false);
    expect(canRelease({ highRisk: true }, "pci")).toBe(true);
    expect(canRelease({ protocolKey: "altoriesgo" }, "pci")).toBe(true);
    expect(canRelease({ protocolKey: "altoriesgo" }, "supervisor")).toBe(false);
  });

  it("supervisor or PCI can release normal rooms", () => {
    expect(canRelease({ protocolKey: "rutina" }, "supervisor")).toBe(true);
    expect(canRelease({ protocolKey: "terminal" }, "pci")).toBe(true);
    expect(canRelease({ protocolKey: "rutina" }, "operador")).toBe(false);
  });

  it("asserting variant throws for disallowed actors", () => {
    expect(() => assertCanRelease({ highRisk: true }, "supervisor")).toThrow(
      /pci/,
    );
    expect(() => assertCanRelease({ protocolKey: "rutina" }, "operador")).toThrow(
      BusinessRuleError,
    );
    expect(() =>
      assertCanRelease({ protocolKey: "terminal" }, "supervisor"),
    ).not.toThrow();
  });
});

describe("verification decision (§8.4)", () => {
  it("returns devuelta on any critical finding regardless of conformity", () => {
    expect(
      decideVerification({
        protocolKey: "rutina",
        conformidadPct: 100,
        hasCriticalFinding: true,
      }),
    ).toBe("devuelta");
  });

  it("applies per-protocol thresholds", () => {
    expect(
      decideVerification({
        protocolKey: "rutina",
        conformidadPct: 90,
        hasCriticalFinding: false,
      }),
    ).toBe("liberada");
    expect(
      decideVerification({
        protocolKey: "terminal",
        conformidadPct: 94,
        hasCriticalFinding: false,
      }),
    ).toBe("devuelta");
  });

  it("forces 100% for high-risk rooms", () => {
    expect(
      decideVerification({
        protocolKey: "terminal",
        conformidadPct: 99,
        hasCriticalFinding: false,
        highRisk: true,
      }),
    ).toBe("devuelta");
    expect(
      decideVerification({
        protocolKey: "altoriesgo",
        conformidadPct: 100,
        hasCriticalFinding: false,
      }),
    ).toBe("liberada");
  });

  it("honors custom thresholds", () => {
    expect(
      decideVerification({
        protocolKey: "rutina",
        conformidadPct: 85,
        hasCriticalFinding: false,
        thresholds: { rutina: 80 },
      }),
    ).toBe("liberada");
  });
});

describe("late verification window (§5)", () => {
  const finished = new Date("2026-05-29T12:00:00Z");

  it("flags terminal verification after 30 min", () => {
    expect(
      isVerificationLate({
        protocolKey: "terminal",
        execFinishedAt: finished,
        verifStartedAt: new Date("2026-05-29T12:31:00Z"),
      }),
    ).toBe(true);
  });

  it("does not flag routine within 2 h", () => {
    expect(
      isVerificationLate({
        protocolKey: "rutina",
        execFinishedAt: finished,
        verifStartedAt: new Date("2026-05-29T13:30:00Z"),
      }),
    ).toBe(false);
  });

  it("respects a custom window", () => {
    expect(
      isVerificationLate({
        protocolKey: "rutina",
        execFinishedAt: finished,
        verifStartedAt: new Date("2026-05-29T12:11:00Z"),
        windowMinutes: 10,
      }),
    ).toBe(true);
  });
});
