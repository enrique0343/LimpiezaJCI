"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

// Controlled modal (prototype .modal). Closes on backdrop click or Escape.
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-[440px] overflow-y-auto rounded-md bg-white">
        <div className="flex items-center gap-[10px] border-b border-gris-cl px-[18px] py-4">
          <span className="text-sm font-bold">{title}</span>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="ml-auto flex p-1"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="px-[18px] py-4">{children}</div>
      </div>
    </div>
  );
}
