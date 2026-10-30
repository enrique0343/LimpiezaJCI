import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";

// Horizontal progress stepper; future steps are locked (spec §10.4).
export function Stepper({
  steps,
  current,
  className,
}: {
  steps: string[];
  /** Zero-based index of the active step. */
  current: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex gap-[6px] overflow-x-auto", className)}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const locked = i > current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex min-w-20 flex-1 items-center justify-center gap-1 rounded-[4px] border px-[10px] py-2 text-center text-[9.5px] font-bold uppercase tracking-[0.04em] [&_svg]:size-3",
              active && "border-negro bg-negro text-white",
              done && "border-verde bg-white text-verde",
              locked && "border-gris-cl bg-gris-bg text-gris-med",
            )}
          >
            {locked && <Lock aria-hidden />}
            {label}
          </li>
        );
      })}
    </ol>
  );
}
