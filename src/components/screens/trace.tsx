"use client";

import { useMemo, useState } from "react";
import { useApp, USERS } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/seed";
import { fmtDateTime } from "@/lib/format";
import { Button } from "@/components/ui";
import { ActionBar } from "./shell";

const TYPE_LABEL: Record<string, string> = {
  login: "Inicio de sesión",
  logout: "Cierre de sesión",
  exec_open: "Apertura de ejecución",
  qr_scan: "Escaneo QR",
  protocol_selected: "Protocolo seleccionado",
  protocol_changed: "Cambio de protocolo",
  insumos_selected: "Insumos seleccionados",
  exec_start: "Inicio de ejecución",
  step_confirm: "Paso confirmado",
  incident: "Incidente",
  photo: "Foto",
  exec_finish: "Cierre de ejecución",
  exec_cancel: "Ejecución cancelada",
  verif_open: "Apertura de verificación",
  verif_finish: "Cierre de verificación",
  release: "Liberación",
  return_for_correction: "Devolución",
  protocol_changed_ignore: "",
  room_state_change: "Cambio de estado",
  sync_conflict: "Conflicto de sincronización",
};

export function Trace() {
  const { traceRoomId, audit, nav } = useApp();
  const [filter, setFilter] = useState<string>("todos");

  const events = useMemo(() => {
    const list = audit
      .filter((e) => e.roomId === traceRoomId)
      .filter((e) => filter === "todos" || e.type === filter)
      .sort((a, b) => a.ts - b.ts);
    return list;
  }, [audit, traceRoomId, filter]);

  const types = useMemo(
    () =>
      Array.from(
        new Set(audit.filter((e) => e.roomId === traceRoomId).map((e) => e.type)),
      ),
    [audit, traceRoomId],
  );

  return (
    <>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-gris">
        Bitácora · Hab. {traceRoomId}
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {["todos", ...types].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={`rounded-[3px] border px-2 py-1 text-[10px] font-bold ${
              filter === t ? "border-negro bg-negro text-white" : "border-gris-cl text-gris-med"
            }`}
          >
            {t === "todos" ? "Todos" : TYPE_LABEL[t] ?? t}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <p className="rounded-[4px] border border-dashed border-gris-cl p-6 text-center text-[12.5px] text-gris-med">
          Sin eventos registrados en esta sesión para esta habitación.
        </p>
      ) : (
        <div className="rounded-[4px] border border-gris-cl bg-white px-[14px]">
          {events.map((e) => {
            const actor = USERS.find((u) => u.id === e.actorId);
            return (
              <div key={e.id} className="flex gap-3 border-b border-gris-cl py-[10px] last:border-none">
                <div className="flex w-[18px] flex-none flex-col items-center">
                  <span className="mt-1 size-[10px] rounded-full bg-negro" />
                  <span className="mt-1 w-[1.5px] flex-1 bg-gris-cl" />
                </div>
                <div className="flex-1">
                  <div className="font-mono text-[10px] text-gris-med">
                    {fmtDateTime(e.ts)}
                  </div>
                  <div className="mt-0.5 text-[13px] font-bold">
                    {TYPE_LABEL[e.type] ?? e.type}
                  </div>
                  <div className="mt-0.5 text-[12px] text-gris">{e.detail}</div>
                  <div className="mt-0.5 text-[10.5px] text-gris-med">
                    {e.isSystem
                      ? "Sistema"
                      : actor
                        ? `${actor.fullName} · ${ROLE_LABEL[actor.role]} · ${actor.code}`
                        : e.actorId}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-center text-[10px] leading-relaxed text-gris-med">
        Bitácora <b className="text-gris">append-only</b>: las correcciones se
        registran como eventos nuevos, nunca se sobrescriben (§9.7).
      </p>

      <ActionBar>
        <Button variant="ghost" onClick={() => nav("dashboard")}>
          Volver al panel
        </Button>
      </ActionBar>
    </>
  );
}
