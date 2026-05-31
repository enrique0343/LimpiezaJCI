import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

// White surface, hairline border, 4px radius (prototype .card / spec §10.4).
export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[4px] border border-gris-cl bg-white p-[14px]",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  icon,
  children,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mb-[10px] flex items-center gap-[7px] text-xs font-bold uppercase tracking-[0.05em] text-gris [&_svg]:size-[14px]",
        className,
      )}
    >
      {icon}
      {children}
    </p>
  );
}
