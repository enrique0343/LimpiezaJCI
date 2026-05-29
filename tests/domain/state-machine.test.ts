import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  StateTransitionError,
} from "@/domain/state-machine";
import type { RoomState } from "@/domain/types";

describe("room state machine (§5)", () => {
  const canonical: [RoomState, RoomState][] = [
    ["pendiente", "en_limpieza"],
    ["en_limpieza", "pend_verificacion"],
    ["en_limpieza", "pendiente"], // cancel
    ["pend_verificacion", "liberada"],
    ["pend_verificacion", "con_hallazgos"],
    ["con_hallazgos", "pendiente"],
    ["liberada", "pendiente"],
  ];

  it.each(canonical)("allows %s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
    expect(() =>
      assertTransition(from, to, { actorRole: "operador" }),
    ).not.toThrow();
  });

  it("rejects transitions outside the diagram", () => {
    expect(canTransition("pendiente", "liberada")).toBe(false);
    expect(canTransition("liberada", "en_limpieza")).toBe(false);
  });

  it("rejects no-op transitions", () => {
    expect(() =>
      assertTransition("pendiente", "pendiente", { actorRole: "gerencia" }),
    ).toThrow(StateTransitionError);
  });

  describe("forced transitions (§9.4)", () => {
    it("requires gerencia role", () => {
      expect(() =>
        assertTransition("liberada", "en_limpieza", { actorRole: "supervisor" }),
      ).toThrow(/gerencia/);
    });

    it("requires a justification even for gerencia", () => {
      expect(() =>
        assertTransition("liberada", "en_limpieza", { actorRole: "gerencia" }),
      ).toThrow(/justification/);
      expect(() =>
        assertTransition("liberada", "en_limpieza", {
          actorRole: "gerencia",
          justification: "   ",
        }),
      ).toThrow(/justification/);
    });

    it("permits gerencia with a justification", () => {
      expect(() =>
        assertTransition("liberada", "en_limpieza", {
          actorRole: "gerencia",
          justification: "Reapertura por hallazgo posterior",
        }),
      ).not.toThrow();
    });
  });
});
