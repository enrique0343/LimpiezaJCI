"use client";

import { useId } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Photo capture slot (prototype .photoslot). Opens the rear camera directly.
 *
 * Privacy (rule §9.8): photos capture surfaces/equipment ONLY — never patients,
 * belongings, or documents. The notice must be visible at every capture, so it
 * is rendered here by default.
 */
export function PhotoSlot({
  name,
  previewUrl,
  onCapture,
  notice = "Solo superficies y equipos. No pacientes ni documentos.",
}: {
  name: string;
  previewUrl?: string;
  onCapture?: (file: File) => void;
  notice?: string;
}) {
  const id = useId();
  const filled = Boolean(previewUrl);

  return (
    <label
      htmlFor={id}
      className={cn(
        "relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[4px] border-2 bg-gris-bg2 text-gris-med",
        filled ? "border-solid border-verde" : "border-dashed border-gris-cl",
      )}
    >
      {filled ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={name}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <>
          <Camera className="mb-[6px] size-6" aria-hidden />
          <span className="text-center text-[10px] leading-tight text-gris-med">
            {notice}
          </span>
        </>
      )}
      <span
        className={cn(
          "text-[11px] font-bold uppercase tracking-[0.05em]",
          filled &&
            "absolute inset-x-[6px] bottom-[6px] rounded-[3px] bg-black/70 px-[6px] py-[3px] text-center text-white",
        )}
      >
        {name}
      </span>
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCapture?.(file);
        }}
      />
    </label>
  );
}
