"use client";

import { ArrowRight, History } from "lucide-react";
import { useApp, PROTOCOLS } from "@/lib/store";
import type { Room } from "@/lib/types";
import type { RoomState } from "@/domain/types";
import { canRelease } from "@/domain";
import { StatePill } from "@/components/ui";

const PIPELINE: { state: RoomState; label: string }[] = [
  { state: "pendiente", label: "Pendiente" },
  { state: "en_limpieza", label: "En limpieza" },
  { state: "pend_verificacion", label: "Verificación" },
  { state: "con_hallazgos", label: "Hallazgos" },
  { state: "liberada", label: "Liberada" },
];

function visibleRooms(rooms: Room[], role: string): Room[] {
  if (role === "operador")
    return rooms.filter((r) =>
      ["pendiente", "con_hallazgos", "en_limpieza"].includes(r.state),
    );
  if (role === "supervisor" || role === "pci")
    return rooms.filter((r) =>
      ["pend_verificacion", "con_hallazgos", "liberada"].includes(r.state),
    );
  return rooms; // gerencia: read-only, all
}

export function Dashboard() {
  const { user, rooms, beginExecution, beginVerification, openTrace } = useApp();
  if (!user) return null;

  const counts = PIPELINE.map((p) => ({
    ...p,
    n: rooms.filter((r) => r.state === p.state).length,
  }));
  const list = visibleRooms(rooms, user.role);

  return (
    <>
      <section className="mb-4 rounded-[4px] border border-gris-cl bg-white p-3">
        <p className="mb-[10px] text-[10px] uppercase tracking-[0.07em] text-gris-med">
          Estado de habitaciones
        </p>
        <div className="flex gap-[6px] overflow-x-auto">
          {counts.map((c) => (
            <div
              key={c.state}
              className="min-w-20 flex-1 rounded-[4px] border border-gris-cl bg-gris-bg p-2 text-center"
            >
              <div className="text-lg font-bold leading-none text-negro">{c.n}</div>
              <div className="mt-[5px] text-[9.5px] uppercase tracking-[0.04em] text-gris-med">
                {c.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="mb-[10px] text-[11px] font-medium uppercase tracking-[0.08em] text-gris">
        {user.role === "operador" ? "Habitaciones por limpiar" : "Habitaciones"}
      </p>

      {list.length === 0 && (
        <p className="rounded-[4px] border border-dashed border-gris-cl p-6 text-center text-[12.5px] text-gris-med">
          No hay habitaciones en tu bandeja.
        </p>
      )}

      <div className="flex flex-col gap-[10px]">
        {list.map((room) => {
          const proto = room.suggestedProto && PROTOCOLS[room.suggestedProto];
          const canOperate =
            user.role === "operador" &&
            ["pendiente", "con_hallazgos"].includes(room.state);
          const canVerify =
            (user.role === "supervisor" || user.role === "pci") &&
            room.state === "pend_verificacion";
          const blockedRelease =
            canVerify && room.highRisk && !canRelease(room, user.role);

          return (
            <div
              key={room.id}
              className="rounded-[4px] border border-gris-cl bg-white p-[13px]"
            >
              <div className="flex items-baseline gap-[10px]">
                <span className="text-xl font-bold text-negro">{room.id}</span>
                <span className="text-[10.5px] uppercase tracking-[0.06em] text-gris-med">
                  {room.tipo}
                </span>
                {room.highRisk && (
                  <span className="rounded-[3px] bg-rojo px-[6px] py-0.5 text-[9px] font-bold uppercase tracking-[0.05em] text-white">
                    Alto riesgo
                  </span>
                )}
                <span className="ml-auto text-[10.5px] text-gris-med">{room.piso}</span>
              </div>

              <p className="mt-[6px] text-[11.5px] text-gris">
                Motivo: <b className="font-bold text-negro">{room.motivo}</b>
                {proto && (
                  <>
                    {" · "}Protocolo sugerido:{" "}
                    <b className="font-bold text-negro">{proto.code}</b>
                  </>
                )}
              </p>

              <div className="mt-[10px] flex items-center gap-2">
                <StatePill state={room.state} />
                <button
                  type="button"
                  onClick={() => openTrace(room.id)}
                  className="ml-auto flex items-center gap-1 text-[11px] font-bold text-gris"
                >
                  <History className="size-[13px]" aria-hidden /> Bitácora
                </button>
              </div>

              {(canOperate || canVerify) && (
                <button
                  type="button"
                  onClick={() =>
                    canOperate ? beginExecution(room.id) : beginVerification(room.id)
                  }
                  className="mt-[10px] flex w-full items-center justify-center gap-1 rounded-[4px] bg-negro px-4 py-[11px] text-[13px] font-bold text-white active:opacity-80"
                >
                  {canOperate ? "Iniciar limpieza" : "Verificar"}
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              )}

              {blockedRelease && (
                <p className="mt-2 rounded-[4px] bg-gris-bg2 px-3 py-2 text-[10.5px] leading-snug text-gris-med">
                  Alto riesgo: la liberación corresponde al Verificador PCI. Puedes
                  revisar pero no liberar (§9.6).
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
