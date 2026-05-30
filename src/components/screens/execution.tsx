"use client";

import { useState } from "react";
import {
  QrCode,
  ScanLine,
  Check,
  Camera,
  CircleCheckBig,
  ArrowRight,
} from "lucide-react";
import { useApp, PROTOCOLS, INSUMOS } from "@/lib/store";
import type { ProtocolKey } from "@/domain/types";
import {
  Button,
  Card,
  CardTitle,
  PhotoSlot,
  StepBlock,
  Stepper,
  Timer,
  Modal,
} from "@/components/ui";
import { ActionBar } from "./shell";
import { fmtTime } from "@/lib/format";

const EXEC_STEPS = ["QR", "Protocolo", "Insumos", "Ejecución", "Fotos", "Cierre"];

function StepperHead({ current }: { current: number }) {
  return (
    <div className="mb-4">
      <Stepper steps={EXEC_STEPS} current={current} />
    </div>
  );
}

export function ExecQR() {
  const { activeRoom, confirmQr } = useApp();
  if (!activeRoom) return null;
  return (
    <>
      <StepperHead current={0} />
      <p className="mb-4 text-[12.5px] leading-relaxed text-gris-med">
        Escanea el código QR de la <b className="text-gris">Hab. {activeRoom.id}</b>{" "}
        para anclar el registro <i>in situ</i> e iniciar el cronómetro.
      </p>
      <div className="relative mx-auto mb-6 aspect-square max-w-[280px] overflow-hidden rounded-lg bg-black">
        <QrCode className="absolute inset-0 m-auto size-24 text-white/20" aria-hidden />
        <div className="absolute inset-x-[8%] top-1/2 h-0.5 animate-pulse bg-verde" />
      </div>
      <p className="text-center text-[13px] text-gris">
        Apunta la cámara al QR en el marco de la puerta.
      </p>
      <ActionBar>
        <Button onClick={() => confirmQr(activeRoom.qrCode)}>
          <ScanLine /> Simular escaneo
        </Button>
      </ActionBar>
    </>
  );
}

export function ExecProtocol() {
  const { activeRoom, exec, selectProtocol } = useApp();
  const [sel, setSel] = useState<ProtocolKey | null>(
    activeRoom?.suggestedProto ?? null,
  );
  const [justif, setJustif] = useState("");
  if (!activeRoom || !exec) return null;
  const changed = Boolean(activeRoom.suggestedProto && sel && sel !== activeRoom.suggestedProto);

  return (
    <>
      <StepperHead current={1} />
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-gris">
        Selecciona el protocolo
      </p>
      {(Object.keys(PROTOCOLS) as ProtocolKey[]).map((key) => {
        const p = PROTOCOLS[key];
        const isSel = sel === key;
        const suggested = activeRoom.suggestedProto === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setSel(key)}
            className={`mb-[10px] w-full rounded-[4px] border bg-white p-[13px] text-left ${
              isSel ? "border-negro bg-gris-bg2" : "border-gris-cl"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{p.name}</span>
              {suggested && (
                <span className="rounded-[3px] bg-turquesa px-[6px] py-0.5 text-[9px] font-bold uppercase tracking-[0.05em] text-white">
                  Sugerido
                </span>
              )}
              <span className="ml-auto text-[10px] text-gris-med">{p.code}</span>
            </div>
            <p className="mt-[6px] text-[11.5px] leading-relaxed text-gris-med">
              {p.desc}
            </p>
            <p className="mt-2 flex flex-wrap gap-3 text-[10px] text-gris-med">
              <span>Norma: <b className="text-gris">{p.norm}</b></span>
              <span>Tiempo: <b className="text-gris">{p.estTime}</b></span>
              <span>Pasos: <b className="text-gris">{p.steps.length}</b></span>
              <span>Fotos: <b className="text-gris">{p.photoReq ? "Sí" : "No"}</b></span>
            </p>
          </button>
        );
      })}

      {changed && (
        <div className="mb-2">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.07em] text-gris">
            Justificación del cambio (obligatoria)
          </p>
          <textarea
            value={justif}
            onChange={(e) => setJustif(e.target.value)}
            placeholder="Motivo para no usar el protocolo sugerido…"
            className="min-h-12 w-full resize-y rounded-[4px] border border-gris-cl px-[10px] py-2 text-[13px] outline-none focus:border-gris"
          />
        </div>
      )}

      <ActionBar>
        <Button
          disabled={!sel}
          onClick={() => sel && selectProtocol(sel, justif)}
        >
          Continuar <ArrowRight />
        </Button>
      </ActionBar>
    </>
  );
}

export function ExecInsumos() {
  const { exec, toggleInsumo, confirmInsumos } = useApp();
  if (!exec) return null;
  return (
    <>
      <StepperHead current={2} />
      <p className="mb-3 text-[12.5px] leading-relaxed text-gris-med">
        Selecciona los insumos utilizados. Quedan atados al registro con su GTIN y
        lote para trazabilidad. Debe incluir al menos un desinfectante.
      </p>
      {INSUMOS.map((i) => {
        const isSel = exec.insumos.includes(i.gtin);
        return (
          <button
            key={i.gtin}
            type="button"
            onClick={() => toggleInsumo(i.gtin)}
            className={`mb-2 flex w-full items-center gap-[11px] rounded-[4px] border bg-white p-[11px] text-left ${
              isSel ? "border-negro bg-gris-bg2" : "border-gris-cl"
            }`}
          >
            <span
              className={`flex size-[18px] flex-none items-center justify-center rounded-[3px] border-[1.5px] ${
                isSel ? "border-negro bg-negro" : "border-gris-cl"
              }`}
            >
              {isSel && <Check className="size-3 text-white" aria-hidden />}
            </span>
            <span>
              <span className="block text-[13px] font-bold">{i.name}</span>
              <span className="mt-0.5 block text-[10.5px] text-gris-med">
                GTIN {i.gtin} · Lote {i.lot} · {i.dil}
              </span>
            </span>
          </button>
        );
      })}
      <ActionBar>
        <Button onClick={confirmInsumos}>
          Iniciar ejecución <ArrowRight />
        </Button>
      </ActionBar>
    </>
  );
}

export function ExecJourney() {
  const { exec, confirmStep, addIncident, finishJourney } = useApp();
  const [incidentStep, setIncidentStep] = useState<number | null>(null);
  const [incidentText, setIncidentText] = useState("");
  if (!exec || !exec.startedAt) return null;

  const proto = PROTOCOLS[exec.protoKey];
  const doneIdx = new Set(exec.stepsConfirmed.map((x) => x.idx));
  const activeStep = proto.steps.findIndex((_, i) => !doneIdx.has(i));
  const allDone = activeStep === -1;

  return (
    <>
      <div className="mb-4 flex items-center gap-3 rounded-[4px] bg-negro px-4 py-[10px] text-white">
        <Timer startedAt={exec.startedAt} />
        <span className="text-[9.5px] uppercase tracking-[0.07em] text-[#bbb]">
          Transcurrido
        </span>
        <span className="ml-auto text-right text-[9.5px] leading-snug text-[#bbb]">
          <b className="text-white">{proto.code}</b> {proto.version}
          <br />
          Paso {Math.min(doneIdx.size + 1, proto.steps.length)} de {proto.steps.length}
        </span>
      </div>

      {proto.steps.map((label, i) => {
        const status = doneIdx.has(i)
          ? "done"
          : i === activeStep
            ? "active"
            : "pending";
        const at = exec.stepsConfirmed.find((x) => x.idx === i)?.at;
        return (
          <StepBlock
            key={i}
            index={i + 1}
            label={label}
            status={status}
            time={at ? fmtTime(at) : undefined}
          >
            <Button variant="success" onClick={() => confirmStep(i)}>
              <Check /> Confirmar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIncidentStep(i);
                setIncidentText("");
              }}
            >
              Incidente
            </Button>
          </StepBlock>
        );
      })}

      <ActionBar>
        <Button disabled={!allDone} onClick={finishJourney}>
          {proto.photoReq ? "Continuar a fotos" : "Finalizar ejecución"}{" "}
          <ArrowRight />
        </Button>
      </ActionBar>

      <Modal
        open={incidentStep !== null}
        onClose={() => setIncidentStep(null)}
        title="Reportar incidente"
      >
        <textarea
          autoFocus
          value={incidentText}
          onChange={(e) => setIncidentText(e.target.value)}
          placeholder="Describe el incidente…"
          className="min-h-16 w-full resize-y rounded-[4px] border border-gris-cl px-[10px] py-2 text-[13px] outline-none focus:border-gris"
        />
        <Button
          variant="warn"
          className="mt-3 w-full"
          onClick={() => {
            if (incidentStep !== null) addIncident(incidentStep, incidentText);
            setIncidentStep(null);
          }}
        >
          Registrar incidente
        </Button>
      </Modal>
    </>
  );
}

export function ExecPhotos() {
  const { exec, capturePhoto, finishExecution } = useApp();
  if (!exec) return null;
  const proto = PROTOCOLS[exec.protoKey];
  return (
    <>
      <StepperHead current={4} />
      <Card>
        <CardTitle icon={<Camera />}>Captura fotográfica</CardTitle>
        <p className="mb-1 text-[11px] leading-snug text-gris-med">
          Solo superficies y equipos. No pacientes, pertenencias ni documentos
          (§9.8).
        </p>
        <div className="grid grid-cols-2 gap-[10px]">
          {proto.photoSlots.map((name, i) => (
            <PhotoSlot
              key={name}
              name={name}
              previewUrl={exec.photos[i] ? undefined : undefined}
              onCapture={() => capturePhoto(i)}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {proto.photoSlots.map((name, i) => (
            <button
              key={name}
              type="button"
              onClick={() => capturePhoto(i)}
              className={`rounded-[3px] border px-2 py-1 text-[10px] font-bold ${
                exec.photos[i]
                  ? "border-verde text-verde"
                  : "border-gris-cl text-gris-med"
              }`}
            >
              {exec.photos[i] ? "✓ " : "○ "}
              {name}
            </button>
          ))}
        </div>
      </Card>
      <ActionBar>
        <Button onClick={finishExecution}>
          <CircleCheckBig /> Finalizar ejecución
        </Button>
      </ActionBar>
    </>
  );
}

export function ExecDone() {
  const { activeRoom, nav } = useApp();
  return (
    <>
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CircleCheckBig className="size-14 text-verde" aria-hidden />
        <h2 className="text-lg font-bold text-azul-marino">Ejecución cerrada</h2>
        <p className="max-w-xs text-[13px] text-gris">
          La Hab. {activeRoom?.id} pasó a <b>pendiente de verificación</b>. Un
          supervisor o PCI (distinto del operador) debe validarla.
        </p>
      </div>
      <ActionBar>
        <Button onClick={() => nav("dashboard")}>Volver al panel</Button>
      </ActionBar>
    </>
  );
}
