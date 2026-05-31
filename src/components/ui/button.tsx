"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "success" | "warn";

// Variants mirror the prototype (.btn-*). Traffic-light variants (success/warn)
// are the documented poka-yoke exception — only for interactive state actions
// (spec §10.3).
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-negro text-white disabled:bg-gris-cl disabled:text-gris-med disabled:cursor-not-allowed",
  ghost: "bg-transparent border border-gris-cl text-gris",
  success: "bg-verde text-white",
  warn: "bg-rojo text-white",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[4px] px-4 py-[13px] text-sm font-bold transition-opacity active:opacity-80 [&_svg]:size-4",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
