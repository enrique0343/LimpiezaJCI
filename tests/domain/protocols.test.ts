import { describe, it, expect } from "vitest";
import { suggestProtocol } from "@/domain/protocols";

describe("protocol suggestion (§6.5)", () => {
  it("maps motives to default protocols (case/space-insensitive)", () => {
    expect(suggestProtocol("Limpieza rutinaria diaria")).toBe("rutina");
    expect(suggestProtocol("Alta de paciente")).toBe("terminal");
    expect(suggestProtocol("  POST-ALTA AISLAMIENTO INFECCIOSO  ")).toBe(
      "aislamiento",
    );
  });

  it("forces high-risk protocol for UCI/quirófano regardless of motive", () => {
    expect(suggestProtocol("Alta de paciente", { highRisk: true })).toBe(
      "altoriesgo",
    );
  });

  it("returns undefined for unknown motives", () => {
    expect(suggestProtocol("motivo desconocido")).toBeUndefined();
  });
});
