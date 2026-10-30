import {
  AlertTriangle,
  Clock,
  Eye,
  ShieldCheck,
  SprayCan,
  type LucideIcon,
} from "lucide-react";
import type { RoomState } from "@/domain/types";
import { cn } from "@/lib/cn";

// Room-state chips are one of the three places traffic-light + institutional
// colors are allowed (spec §10.3). Mirrors the prototype .sp-* classes.
const STATE: Record<
  RoomState,
  { label: string; className: string; Icon: LucideIcon }
> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-gris-bg2 text-gris",
    Icon: Clock,
  },
  en_limpieza: {
    label: "En limpieza",
    className: "bg-azul-marino text-white",
    Icon: SprayCan,
  },
  pend_verificacion: {
    label: "Pend. verificación",
    className: "bg-turquesa text-white",
    Icon: Eye,
  },
  con_hallazgos: {
    label: "Con hallazgos",
    className: "bg-ambar text-white",
    Icon: AlertTriangle,
  },
  liberada: {
    label: "Liberada",
    className: "bg-verde text-white",
    Icon: ShieldCheck,
  },
};

export function StatePill({ state }: { state: RoomState }) {
  const { label, className, Icon } = STATE[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] rounded-[3px] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.05em] [&_svg]:size-[11px]",
        className,
      )}
    >
      <Icon aria-hidden />
      {label}
    </span>
  );
}
