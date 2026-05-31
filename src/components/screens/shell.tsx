"use client";

import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useApp } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/seed";

// App chrome: dark top bar (prototype .topbar) + user strip (.userstrip).
export function Shell({
  title = "Limpieza con Trazabilidad",
  subtitle = "JCI PCI.04.00 · 8ª edición",
  showBack = false,
  children,
}: {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  children: ReactNode;
}) {
  const { user, back, logout } = useApp();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-gris-bg">
      <header className="sticky top-0 z-30 flex items-center gap-[10px] bg-negro px-4 py-3 text-white">
        {showBack && (
          <button
            type="button"
            aria-label="Atrás"
            onClick={back}
            className="flex rounded-[4px] p-1 active:bg-white/10"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
        )}
        <div>
          <div className="text-[13px] font-bold leading-tight">{title}</div>
          <div className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-[#cfcfcf]">
            {subtitle}
          </div>
        </div>
        <div className="ml-auto text-right text-[9px] leading-snug tracking-[0.07em] text-[#bdbdbd]">
          GO-PRY-001-2026
          <br />
          <span className="opacity-60">v1 · demo</span>
        </div>
      </header>

      {user && (
        <div className="flex items-center gap-2 border-b border-gris-cl bg-gris-bg2 px-4 py-2 text-[11px] text-gris">
          Conectado como <b className="font-bold text-negro">{user.fullName}</b>
          <span className="rounded-[3px] bg-negro px-[6px] py-0.5 text-[9px] uppercase tracking-[0.07em] text-white">
            {ROLE_LABEL[user.role]}
          </span>
          <button
            type="button"
            onClick={logout}
            className="ml-auto text-azul-marino underline decoration-gris-cl"
          >
            Cambiar
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 pb-[130px] pt-4">{children}</main>
    </div>
  );
}

// Fixed bottom action bar (prototype .actionbar).
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[25] mx-auto flex w-full max-w-[480px] items-center gap-2 border-t border-gris-cl bg-white px-4 py-3 [&>button]:flex-1">
      {children}
    </div>
  );
}
