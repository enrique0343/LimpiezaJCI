// Pure indicator computation (spec §8.6 aggregated reports). Operates on plain
// arrays so it is framework-free and unit-testable; the API route feeds it rows
// from D1. No measurement asks anything extra of the operator — every number
// here is derived from scans, step confirmations and the records already kept.
import type { ProtocolKey, RoomState } from "@/domain/types";

export interface MetricsRoom {
  id: string;
  state: RoomState;
  highRisk: boolean;
  execRecord?: {
    protoKey: ProtocolKey;
    startedAt: number;
    finishedAt?: number;
    enteredAt?: number;
    exitedAt?: number;
  };
  verifRecord?: {
    late: boolean;
    decision?: "liberada" | "devuelta";
    conformidad: number;
    results?: Record<string, { estado: string; severity?: string }>;
  };
  releasedAt?: number;
}

export interface ProtocolTime {
  proto: ProtocolKey;
  n: number;
  avgMin: number;
  estMin: number;
  /** Signed % deviation from the estimate (+ = slower than benchmark). */
  deltaPct: number;
}

export interface Metrics {
  counts: Record<RoomState, number>;
  ejecuciones: number;
  adherenciaPct: number;
  retrabajoPct: number;
  verifTardiasPct: number;
  conformidadPromedio: number;
  hallazgosCriticosAbiertos: number;
  tiempoEnHabitacionPromedioMin: number;
  cicloPromedioMin: number;
  porProtocolo: ProtocolTime[];
}

const STATES: RoomState[] = [
  "pendiente",
  "en_limpieza",
  "pend_verificacion",
  "con_hallazgos",
  "liberada",
];

const round = (n: number) => Math.round(n);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const toMin = (ms: number) => ms / 60000;

export function computeMetrics(
  rooms: MetricsRoom[],
  estimatedMinutes: Partial<Record<ProtocolKey, number>>,
): Metrics {
  const counts = Object.fromEntries(STATES.map((s) => [s, 0])) as Record<RoomState, number>;
  for (const r of rooms) counts[r.state] = (counts[r.state] ?? 0) + 1;

  const execs = rooms.filter((r) => r.execRecord);
  const verifs = rooms
    .map((r) => r.verifRecord)
    .filter((v): v is NonNullable<MetricsRoom["verifRecord"]> => Boolean(v));

  const liberadas = counts.liberada;
  const adherenciaPct = execs.length ? round((liberadas / execs.length) * 100) : 0;
  const devueltas = verifs.filter((v) => v.decision === "devuelta").length;
  const retrabajoPct = verifs.length ? round((devueltas / verifs.length) * 100) : 0;
  const tardias = verifs.filter((v) => v.late).length;
  const verifTardiasPct = verifs.length ? round((tardias / verifs.length) * 100) : 0;
  const conformidadPromedio = verifs.length ? round(avg(verifs.map((v) => v.conformidad))) : 0;

  const hallazgosCriticosAbiertos = rooms.filter(
    (r) =>
      r.state === "con_hallazgos" &&
      r.verifRecord?.results &&
      Object.values(r.verifRecord.results).some(
        (x) => x.estado === "no_conforme" && x.severity === "critico",
      ),
  ).length;

  const roomMins = execs
    .map((r) => {
      const e = r.execRecord!;
      const start = e.enteredAt ?? e.startedAt;
      const end = e.exitedAt ?? e.finishedAt;
      return end && end > start ? toMin(end - start) : NaN;
    })
    .filter((x) => Number.isFinite(x));
  const tiempoEnHabitacionPromedioMin = round(avg(roomMins));

  const cicloMins = rooms
    .filter((r) => r.state === "liberada" && r.execRecord && r.releasedAt)
    .map((r) => toMin(r.releasedAt! - r.execRecord!.startedAt))
    .filter((x) => x > 0);
  const cicloPromedioMin = round(avg(cicloMins));

  const byProto = new Map<ProtocolKey, number[]>();
  for (const r of execs) {
    const e = r.execRecord!;
    if (!e.finishedAt || e.finishedAt <= e.startedAt) continue;
    const arr = byProto.get(e.protoKey) ?? [];
    arr.push(toMin(e.finishedAt - e.startedAt));
    byProto.set(e.protoKey, arr);
  }
  const porProtocolo: ProtocolTime[] = [...byProto.entries()].map(([proto, mins]) => {
    const avgMin = round(avg(mins));
    const estMin = estimatedMinutes[proto] ?? 0;
    return {
      proto,
      n: mins.length,
      avgMin,
      estMin,
      deltaPct: estMin ? round(((avgMin - estMin) / estMin) * 100) : 0,
    };
  });

  return {
    counts,
    ejecuciones: execs.length,
    adherenciaPct,
    retrabajoPct,
    verifTardiasPct,
    conformidadPromedio,
    hallazgosCriticosAbiertos,
    tiempoEnHabitacionPromedioMin,
    cicloPromedioMin,
    porProtocolo,
  };
}
