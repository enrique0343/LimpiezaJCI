import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type StepStatus = "pending" | "active" | "done";

// Guided-execution step (prototype .stepblk). `done` turns the marker green and
// shows the confirmation timestamp; `active` is the current unlocked step.
export function StepBlock({
  index,
  label,
  status,
  time,
  children,
}: {
  index: number;
  label: string;
  status: StepStatus;
  /** Confirmation time, shown when done (already formatted, UTC→local upstream). */
  time?: string;
  /** Actions (Confirmar / Incidente) rendered for the active step. */
  children?: ReactNode;
}) {
  const done = status === "done";
  const active = status === "active";
  return (
    <div
      className={cn(
        "mb-2 rounded-[4px] border p-[12px] transition-colors",
        done ? "border-verde bg-[#f4faf7]" : "border-gris-cl bg-white",
      )}
    >
      <div className="flex items-center gap-[10px]">
        <span
          className={cn(
            "flex size-6 flex-none items-center justify-center rounded-full border-[1.5px] text-[11px] font-bold [&_svg]:size-[13px]",
            done && "border-verde bg-verde text-white",
            active && "border-negro bg-negro text-white",
            !done && !active && "border-gris-cl text-gris-med",
          )}
        >
          {done ? <Check aria-hidden /> : index}
        </span>
        <span
          className={cn(
            "flex-1 text-[13.5px] leading-snug",
            done && "text-gris",
          )}
        >
          {label}
        </span>
      </div>
      {time && (
        <p className="mt-1 pl-[34px] font-mono text-[10px] text-gris-med">
          {time}
        </p>
      )}
      {active && children && (
        <div className="mt-[10px] flex gap-[6px] pl-[34px]">{children}</div>
      )}
    </div>
  );
}
