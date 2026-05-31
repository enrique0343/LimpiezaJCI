"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

function format(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Counts up from `startedAt` using the client clock — never editable (spec
 * §9.2; the server still stamps the authoritative event times). Monospace.
 */
export function Timer({
  startedAt,
  className,
}: {
  startedAt: Date | number;
  className?: string;
}) {
  const start = typeof startedAt === "number" ? startedAt : startedAt.getTime();
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={cn("font-mono text-lg font-bold tracking-tight", className)}
      role="timer"
      aria-live="off"
    >
      {format(now - start)}
    </span>
  );
}
