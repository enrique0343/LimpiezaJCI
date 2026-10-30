import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Neutral, uppercase, hairline (prototype .vbadge / .upill). No color by design.
export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[3px] border border-gris-cl px-[6px] py-[2px] text-[9px] font-bold uppercase tracking-[0.05em] text-gris",
        className,
      )}
      {...props}
    />
  );
}
