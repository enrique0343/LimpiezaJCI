"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useApp, PROTOCOLS } from "@/lib/store";
import { computeMetrics, type MetricsRoom } from "@/lib/metrics";
import type { ProtocolKey } from "@/domain/types";
import { Card } from "@/components/ui";
import { ActionBar } from "./shell";
import { Button } from "@/components/ui";

const EST: Record<ProtocolKey, number> = {
  rutina: PROTOCOLS.rutina.estMin,
  terminal: PROTOCOLS.terminal.estMin,
  aislamiento: PROTOCOLS.aislamiento.estMin,
  altoriesgo: PROTOCOLS.altoriesgo.estMin,
};

function Tile({
  value,
  label,
  tone = "neutral",
}: {
  value: string;
  label: string;
  tone?: "neutral" | "verde" | "ambar" | "rojo";
}) {
  const color =
    tone === "verde"
      ? "text-verde"
      : tone === "ambar"
        ? "text-ambar"
        : tone === "rojo"
          ? "text-rojo"
          : "text-azul-marino";
  return (
    <Card className="text-center">
      <div className={`text-2xl font-bold leading-none ${color}`}>{value}</div>
      <div className="mt-2 text-[9.5px] uppercase tracking-[0.06em] text-gris-med">
        {label}
      </div>
    </Card>
  );
}

export function Reportes() {
  const { rooms, nav } = useApp();

  const m = useMemo(() => {
    const mapped: MetricsRoom[] = rooms.map((r) => ({
      id: r.id,
      state: r.state,
      highRisk: r.highRisk,
      execRecord: r.execRecord
        ? {
            protoKey: r.execRecord.protoKey,
            startedAt: r.execRecord.startedAt,
            finishedAt: r.execRecord.finishedAt,
            enteredAt: r.execRecord.enteredAt,
            exitedAt: r.execRecord.exitedAt,
          }
        : undefined,
      verifRecord: r.verifRecord
        ? {
            late: r.verifRecord.late,
            decision: r.verifRecord.decision,
            conformidad: r.verifRecord.conformidad,
            results: r.verifRecord.results as Record<
              string,
              { estado: string; severity?: string }
            >,
          }
        : undefined,
      releasedAt: r.releasedAt,
    }));
    return computeMetrics(mapped, EST);
  }, [rooms]);

  const deltaTone = (d: number) =>
    Math.abs(d) <= 15 ? "verde" : Math.abs(d) <= 30 ? "ambar" : "rojo";

  return (
    <>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-gris">
        Indicadores · PCI.04.00 ME#4
      </p>

      <div className="mb-4 grid grid-cols-2 gap-[10px] md:grid-cols-4">
        <Tile
          value={`${m.adherenciaPct}%`}
          label="Adherencia"
          tone={m.adherenciaPct >= 95 ? "verde" : m.adherenciaPct >= 80 ? "ambar" : "rojo"}
        />
        <Tile
          value={`${m.conformidadPromedio}%`}
          label="Conformidad prom."
          tone={m.conformidadPromedio >= 95 ? "verde" : "ambar"}
        />
        <Tile
          value={`${m.verifTardiasPct}%`}
          label="Verif. tardías"
          tone={m.verifTardiasPct <= 10 ? "verde" : "ambar"}
        />
        <Tile
          value={`${m.retrabajoPct}%`}
          label="Retrabajo"
          tone={m.retrabajoPct === 0 ? "verde" : m.retrabajoPct <= 20 ? "ambar" : "rojo"}
        />
        <Tile value={`${m.tiempoEnHabitacionPromedioMin}m`} label="Tiempo en habitación" />
        <Tile value={`${m.cicloPromedioMin}m`} label="Ciclo prom. (turnaround)" />
        <Tile value={`${m.ejecuciones}`} label="Ejecuciones" />
        <Tile
          value={`${m.hallazgosCriticosAbiertos}`}
          label="Críticos abiertos"
          tone={m.hallazgosCriticosAbiertos === 0 ? "verde" : "rojo"}
        />
      </div>

      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-gris">
        Tiempo por protocolo vs. estimado
      </p>
      <Card className="mb-4 p-0">
        {m.porProtocolo.length === 0 ? (
          <p className="p-4 text-center text-[12.5px] text-gris-med">
            Sin ejecuciones cerradas en este periodo.
          </p>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-gris-cl text-left text-[10px] uppercase tracking-[0.05em] text-gris-med">
                <th className="p-3 font-medium">Protocolo</th>
                <th className="p-3 font-medium">n</th>
                <th className="p-3 font-medium">Prom.</th>
                <th className="p-3 font-medium">Estimado</th>
                <th className="p-3 font-medium">Δ</th>
              </tr>
            </thead>
            <tbody>
              {m.porProtocolo.map((p) => (
                <tr key={p.proto} className="border-b border-gris-cl last:border-none">
                  <td className="p-3 font-bold">{PROTOCOLS[p.proto].code}</td>
                  <td className="p-3 text-gris">{p.n}</td>
                  <td className="p-3 text-gris">{p.avgMin}m</td>
                  <td className="p-3 text-gris-med">{p.estMin}m</td>
                  <td className={`p-3 font-bold text-${deltaTone(p.deltaPct)}`}>
                    {p.deltaPct > 0 ? "+" : ""}
                    {p.deltaPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {m.hallazgosCriticosAbiertos > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-[4px] border border-rojo bg-white px-3 py-2 text-[12px] text-rojo">
          <AlertTriangle className="size-4 flex-none" aria-hidden />
          {m.hallazgosCriticosAbiertos} hallazgo(s) crítico(s) abierto(s): habitación
          no liberable hasta corregir (§9.6).
        </div>
      )}

      <p className="text-center text-[10px] leading-relaxed text-gris-med">
        Todos los indicadores se derivan de escaneos y confirmaciones ya
        registrados — <b className="text-gris">sin captura adicional</b> del
        personal operativo. Alimenta el Diálogo Mensual de Desempeño (§16).
      </p>

      <ActionBar>
        <Button variant="ghost" onClick={() => nav("dashboard")}>
          Volver al panel
        </Button>
      </ActionBar>
    </>
  );
}
