"use client";

import { useState } from "react";
import { Eye, Check, X, Minus, ShieldCheck, AlertTriangle } from "lucide-react";
import { useApp, PROTOCOLS, VERIF_TEMPLATE, USERS } from "@/lib/store";
import type { Severity } from "@/domain/types";
import { Button, Badge } from "@/components/ui";
import { ActionBar } from "./shell";
import { fmtTime, elapsed } from "@/lib/format";

const SEVERITIES: { key: Severity; label: string }[] = [
  { key: "menor", label: "Menor" },
  { key: "mayor", label: "Mayor" },
  { key: "critico", label: "Crítico" },
];

export function VerifReview() {
  const { activeRoom, nav } = useApp();
  const exec = activeRoom?.execRecord;
  if (!activeRoom || !exec) return null;
  const proto = PROTOCOLS[exec.protoKey];
  const operator = USERS.find((u) => u.id === exec.operatorId);
  const photoCount = Object.keys(exec.photos).length;

  return (
    <>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-gris">
        Revisión de ejecución · Hab. {activeRoom.id}
      </p>
      <div className="mb-4 rounded-[4px] border border-gris-cl bg-gris-bg2 p-[13px]">
        <p className="mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.06em] text-gris-med">
          <Eye className="size-[13px]" aria-hidden /> Registro de ejecución (solo lectura)
        </p>
        {[
          ["Operador", `${operator?.fullName ?? exec.operatorId} (${operator?.code ?? ""})`],
          ["Protocolo", `${proto.code} ${proto.version}`],
          ["Inicio", fmtTime(exec.startedAt)],
          ["Cierre", exec.finishedAt ? fmtTime(exec.finishedAt) : "—"],
          ["Duración", exec.finishedAt ? elapsed(exec.startedAt, exec.finishedAt) : "—"],
          ["Insumos", `${exec.insumos.length} seleccionados`],
          ["Fotos", `${photoCount}`],
          ["Incidentes", `${exec.incidents.length}`],
        ].map(([k, v]) => (
          <div key={k} className="mb-1 flex items-baseline gap-2 text-[12.5px]">
            <b className="min-w-20 font-bold text-negro">{k}</b>
            <span className="text-gris">{v}</span>
          </div>
        ))}
      </div>
      <ActionBar>
        <Button onClick={() => nav("verif_journey")}>Iniciar verificación</Button>
      </ActionBar>
    </>
  );
}

export function VerifJourney() {
  const { activeRoom, verif, setVerifResult, finishVerification } = useApp();
  const [notes, setNotes] = useState<Record<string, string>>({});
  if (!activeRoom || !verif) return null;

  const total = VERIF_TEMPLATE.reduce((a, ar) => a + ar.items.length, 0);
  const answered = Object.keys(verif.results).length;
  const allAnswered = answered === total;

  return (
    <>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-gris">
        Recorrido de verificación · {answered}/{total}
      </p>

      {VERIF_TEMPLATE.map((area) => (
        <div key={area.area} className="mb-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.07em] text-gris-med">
            {area.area}
          </p>
          {area.items.map((item) => {
            const res = verif.results[item.id];
            return (
              <div
                key={item.id}
                className="mb-2 rounded-[4px] border border-gris-cl bg-white p-[13px]"
              >
                <div className="flex items-start gap-[10px]">
                  <span className="flex-1 text-[13px] leading-snug">{item.l}</span>
                  <Badge>{item.t}</Badge>
                </div>
                <div className="mt-[10px] grid grid-cols-3 gap-[6px]">
                  <OptBtn
                    active={res?.estado === "conforme"}
                    tone="c"
                    onClick={() => setVerifResult(item.id, "conforme")}
                  >
                    <Check className="size-[14px]" /> Conforme
                  </OptBtn>
                  <OptBtn
                    active={res?.estado === "no_conforme"}
                    tone="n"
                    onClick={() =>
                      setVerifResult(item.id, "no_conforme", res?.severity ?? "menor", notes[item.id])
                    }
                  >
                    <X className="size-[14px]" /> No conf.
                  </OptBtn>
                  <OptBtn
                    active={res?.estado === "na"}
                    tone="na"
                    onClick={() => setVerifResult(item.id, "na")}
                  >
                    <Minus className="size-[14px]" /> N/A
                  </OptBtn>
                </div>

                {res?.estado === "no_conforme" && (
                  <div className="mt-[10px] border-t border-dashed border-gris-cl pt-[10px]">
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.07em] text-gris">
                      Severidad
                    </p>
                    <div className="flex gap-[6px]">
                      {SEVERITIES.map((sv) => (
                        <button
                          key={sv.key}
                          type="button"
                          onClick={() =>
                            setVerifResult(item.id, "no_conforme", sv.key, notes[item.id])
                          }
                          className={`flex-1 rounded-[4px] border-[1.5px] px-2 py-[7px] text-[11px] font-bold ${
                            res.severity === sv.key
                              ? sv.key === "critico"
                                ? "border-rojo bg-rojo text-white"
                                : sv.key === "mayor"
                                  ? "border-rojo2 bg-rojo2 text-white"
                                  : "border-ambar bg-ambar text-white"
                              : "border-gris-cl text-gris-med"
                          }`}
                        >
                          {sv.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={notes[item.id] ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNotes((n) => ({ ...n, [item.id]: v }));
                        setVerifResult(item.id, "no_conforme", res.severity ?? "menor", v);
                      }}
                      placeholder="Nota (obligatoria para no conforme)…"
                      className="mt-2 min-h-12 w-full resize-y rounded-[4px] border border-gris-cl px-[10px] py-2 text-[13px] outline-none focus:border-gris"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <ActionBar>
        <Button disabled={!allAnswered} onClick={finishVerification}>
          Finalizar verificación
        </Button>
      </ActionBar>
    </>
  );
}

function OptBtn({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: "c" | "n" | "na";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const base =
    "flex items-center justify-center gap-[5px] rounded-[4px] border-[1.5px] px-1 py-[9px] text-[12px] font-bold";
  const tones: Record<string, string> = {
    c: active ? "border-verde bg-verde text-white" : "border-verde text-verde",
    n: active ? "border-rojo bg-rojo text-white" : "border-rojo text-rojo",
    na: active ? "border-gris-med bg-gris-med text-white" : "border-gris-cl text-gris-med",
  };
  return (
    <button type="button" onClick={onClick} className={`${base} ${tones[tone]}`}>
      {children}
    </button>
  );
}

export function VerifDone() {
  const { activeRoom, nav } = useApp();
  const rec = activeRoom?.verifRecord;
  const liberada = rec?.decision === "liberada";
  return (
    <>
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        {liberada ? (
          <ShieldCheck className="size-14 text-verde" aria-hidden />
        ) : (
          <AlertTriangle className="size-14 text-ambar" aria-hidden />
        )}
        <h2 className="text-lg font-bold text-azul-marino">
          {liberada ? "Habitación liberada" : "Devuelta para corrección"}
        </h2>
        <p className="max-w-xs text-[13px] text-gris">
          Conformidad <b>{rec?.conformidad ?? 0}%</b>
          {rec?.late && " · verificación tardía"}.{" "}
          {liberada
            ? `La Hab. ${activeRoom?.id} está lista para admisión.`
            : `La Hab. ${activeRoom?.id} vuelve al flujo para reejecución.`}
        </p>
      </div>
      <ActionBar>
        <Button onClick={() => nav("dashboard")}>Volver al panel</Button>
      </ActionBar>
    </>
  );
}
