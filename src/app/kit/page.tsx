"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, ClipboardList } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardTitle,
  Modal,
  PhotoSlot,
  StatePill,
  StepBlock,
  Stepper,
  Timer,
  ToastProvider,
  useToast,
} from "@/components/ui";
import type { RoomState } from "@/domain/types";

const STATES: RoomState[] = [
  "pendiente",
  "en_limpieza",
  "pend_verificacion",
  "con_hallazgos",
  "liberada",
];

const STEPS = ["QR", "Protocolo", "Insumos", "Ejecución", "Fotos", "Cierre"];

function Showcase() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [startedAt] = useState(() => Date.now());

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-4 p-4">
      <header>
        <p className="text-[11px] uppercase tracking-widest text-gris-med">
          UI kit · Avante (§10.4)
        </p>
        <h1 className="text-xl font-bold text-azul-marino">
          Componentes base
        </h1>
      </header>

      <Card>
        <CardTitle icon={<ClipboardList />}>Botones</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => toast("Acción primaria")}>Primary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="success">
            <CheckCircle2 /> Conforme
          </Button>
          <Button variant="warn">
            <AlertTriangle /> No conforme
          </Button>
          <Button disabled>Deshabilitado</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Estados de habitación</CardTitle>
        <div className="flex flex-wrap gap-2">
          {STATES.map((s) => (
            <StatePill key={s} state={s} />
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Badge>PNT-LIM-002</Badge>
          <Badge>v1.3</Badge>
        </div>
      </Card>

      <Card>
        <CardTitle>Stepper &amp; Timer</CardTitle>
        <Stepper steps={STEPS} current={3} />
        <div className="mt-3 flex items-center gap-3 rounded-[4px] bg-negro px-4 py-[10px] text-white">
          <Timer startedAt={startedAt} />
          <span className="text-[9.5px] uppercase tracking-[0.07em] text-gris-cl">
            Transcurrido
          </span>
        </div>
      </Card>

      <Card>
        <CardTitle>Pasos de ejecución</CardTitle>
        <StepBlock index={1} label="EPP correctamente colocado" status="done" time="08:12" />
        <StepBlock index={2} label="Retirar desechos comunes" status="active">
          <Button variant="success">Confirmar</Button>
          <Button variant="ghost" onClick={() => setOpen(true)}>
            Incidente
          </Button>
        </StepBlock>
        <StepBlock index={3} label="Desinfectar superficies" status="pending" />
      </Card>

      <Card>
        <CardTitle>Captura fotográfica</CardTitle>
        <div className="grid grid-cols-2 gap-[10px]">
          <PhotoSlot name="Baño" />
          <PhotoSlot name="Cama y mobiliario" />
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Reportar incidente">
        <p className="text-sm text-gris">
          Modal de ejemplo. Cierra con Escape, la X o el fondo.
        </p>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setOpen(false)}>Cerrar</Button>
        </div>
      </Modal>
    </main>
  );
}

export default function KitPage() {
  return (
    <ToastProvider>
      <Showcase />
    </ToastProvider>
  );
}
