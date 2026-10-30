import { describe, it, expect } from "vitest";
import { computeMetrics, type MetricsRoom } from "@/lib/metrics";

const EST = { rutina: 15, terminal: 45, aislamiento: 75, altoriesgo: 60 };
const H = 3600e3;

const rooms: MetricsRoom[] = [
  { id: "201", state: "pendiente", highRisk: false },
  {
    id: "203",
    state: "pend_verificacion",
    highRisk: false,
    execRecord: {
      protoKey: "terminal",
      startedAt: 0,
      finishedAt: 50 * 60000,
      enteredAt: 0,
      exitedAt: 52 * 60000,
    },
  },
  {
    id: "301",
    state: "liberada",
    highRisk: false,
    execRecord: { protoKey: "terminal", startedAt: 0, finishedAt: 40 * 60000 },
    verifRecord: { late: false, decision: "liberada", conformidad: 100 },
    releasedAt: 1 * H,
  },
  {
    id: "UCI-1",
    state: "con_hallazgos",
    highRisk: true,
    execRecord: { protoKey: "altoriesgo", startedAt: 0, finishedAt: 70 * 60000 },
    verifRecord: {
      late: true,
      decision: "devuelta",
      conformidad: 60,
      results: { c1: { estado: "no_conforme", severity: "critico" } },
    },
  },
];

describe("computeMetrics (§8.6)", () => {
  const m = computeMetrics(rooms, EST);

  it("counts rooms by state", () => {
    expect(m.counts.pendiente).toBe(1);
    expect(m.counts.liberada).toBe(1);
    expect(m.counts.con_hallazgos).toBe(1);
  });

  it("computes adherence over executions", () => {
    expect(m.ejecuciones).toBe(3);
    expect(m.adherenciaPct).toBe(33); // 1 liberada / 3 execs
  });

  it("computes rework and late rates over verifications", () => {
    expect(m.retrabajoPct).toBe(50); // 1 devuelta / 2 verifs
    expect(m.verifTardiasPct).toBe(50);
  });

  it("averages conformity", () => {
    expect(m.conformidadPromedio).toBe(80); // (100 + 60) / 2
  });

  it("counts open critical findings", () => {
    expect(m.hallazgosCriticosAbiertos).toBe(1);
  });

  it("uses scan-in/out when present for time in room", () => {
    // 52m (203 scan bracket) + 40m (301 exec) + 70m (UCI exec) → avg 54
    expect(m.tiempoEnHabitacionPromedioMin).toBe(54);
  });

  it("benchmarks per-protocol time vs estimate", () => {
    const terminal = m.porProtocolo.find((p) => p.proto === "terminal")!;
    expect(terminal.n).toBe(2);
    expect(terminal.avgMin).toBe(45); // (50 + 40) / 2
    expect(terminal.estMin).toBe(45);
    expect(terminal.deltaPct).toBe(0);
  });

  it("handles empty input", () => {
    const e = computeMetrics([], EST);
    expect(e.adherenciaPct).toBe(0);
    expect(e.porProtocolo).toHaveLength(0);
  });
});
