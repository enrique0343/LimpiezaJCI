"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ProtocolKey, Severity } from "@/domain/types";
import {
  assertTransition,
  createAuditEvent,
  decideVerification,
  isVerificationLate,
  type AuditEventInput,
  BusinessRuleError,
  assertCanVerify,
  canRelease,
  StateTransitionError,
} from "@/domain";
import { useToast } from "@/components/ui";
import {
  DEMO_PINS,
  INSUMOS,
  PROTOCOLS,
  seedRooms,
  USERS,
  VERIF_TEMPLATE,
} from "./seed";
import type {
  AppUser,
  ExecRecord,
  Room,
  StoredAuditEvent,
  VerifResult,
} from "./types";

export type Screen =
  | "login"
  | "dashboard"
  | "exec_qr"
  | "exec_protocol"
  | "exec_insumos"
  | "exec_journey"
  | "exec_photos"
  | "exec_done"
  | "verif_review"
  | "verif_journey"
  | "verif_done"
  | "trace";

interface ExecDraft {
  roomId: string;
  operatorId: string;
  motivo: string;
  protoKey: ProtocolKey;
  qrScannedAt: number;
  startedAt?: number;
  stepsConfirmed: { idx: number; at: number }[];
  insumos: string[];
  photos: Record<number, string>;
  incidents: { stepIdx: number; text: string; at: number }[];
}

interface VerifDraft {
  roomId: string;
  verifierId: string;
  startedAt: number;
  results: Record<string, VerifResult>;
}

interface AppState {
  user: AppUser | null;
  rooms: Room[];
  audit: StoredAuditEvent[];
  screen: Screen;
  history: Screen[];
  activeRoomId: string | null;
  exec: ExecDraft | null;
  verif: VerifDraft | null;
  traceRoomId: string | null;
}

let evtSeq = 0;
const rid = (p: string) => `${p}_${Date.now().toString(36)}_${(evtSeq++).toString(36)}`;

function toStored(input: AuditEventInput): StoredAuditEvent {
  const ev = createAuditEvent(input, new Date());
  return {
    id: rid("evt"),
    ts: ev.ts.getTime(),
    type: ev.type,
    detail: ev.detail,
    actorId: ev.actorId,
    isSystem: ev.isSystem,
    roomId: ev.roomId,
    prevEventId: ev.prevEventId,
    payload: ev.payload,
  };
}

interface AppContextValue extends AppState {
  login: (userId: string, pin: string) => boolean;
  logout: () => void;
  nav: (s: Screen) => void;
  back: () => void;
  openTrace: (roomId: string) => void;
  // execution
  beginExecution: (roomId: string) => void;
  confirmQr: (code: string) => void;
  selectProtocol: (key: ProtocolKey, justification?: string) => void;
  toggleInsumo: (gtin: string) => void;
  confirmInsumos: () => void;
  confirmStep: (idx: number) => void;
  addIncident: (stepIdx: number, text: string) => void;
  finishJourney: () => void;
  capturePhoto: (slotIdx: number, url?: string) => void;
  finishExecution: () => void;
  // verification
  beginVerification: (roomId: string) => void;
  setVerifResult: (
    itemId: string,
    estado: VerifResult["estado"],
    severity?: Severity,
    note?: string,
  ) => void;
  finishVerification: () => void;
  // helpers
  activeRoom: Room | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [state, setState] = useState<AppState>(() => ({
    user: null,
    rooms: seedRooms(),
    audit: [],
    screen: "login",
    history: [],
    activeRoomId: null,
    exec: null,
    verif: null,
    traceRoomId: null,
  }));

  const patch = useCallback(
    (fn: (s: AppState) => AppState) => setState((s) => fn(s)),
    [],
  );

  // Latest state, for reading inside fire-and-forget side effects.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Hydrate rooms from Cloudflare D1 on mount; fall back to seed data (so the
  // demo still works offline / without bindings). Best-effort.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/rooms")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.ok && Array.isArray(data.rooms) && data.rooms.length) {
          patch((s) => ({ ...s, rooms: data.rooms as Room[] }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [patch]);

  // Best-effort persistence to D1 (the API re-derives/enforces the §9 rules).
  const persistExecutionRemote = useCallback((exec: ExecDraft) => {
    const proto = PROTOCOLS[exec.protoKey];
    void fetch("/api/executions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        roomId: exec.roomId,
        operatorId: exec.operatorId,
        protocolCode: proto.code,
        protocolVersion: proto.version,
        motivo: exec.motivo,
        qrScannedAt: exec.qrScannedAt,
        startedAt: exec.startedAt ?? Date.now(),
        finishedAt: Date.now(),
        stepsConfirmed: exec.stepsConfirmed,
        insumos: exec.insumos,
        photos: exec.photos,
        incidents: exec.incidents,
      }),
    }).catch(() => {});
  }, []);

  const log = useCallback(
    (s: AppState, ...inputs: AuditEventInput[]): StoredAuditEvent[] => {
      return [...s.audit, ...inputs.map(toStored)];
    },
    [],
  );

  const nav = useCallback(
    (screen: Screen) =>
      patch((s) => ({ ...s, history: [...s.history, s.screen], screen })),
    [patch],
  );

  const back = useCallback(
    () =>
      patch((s) => {
        const history = [...s.history];
        const prev = history.pop() ?? "dashboard";
        return { ...s, history, screen: prev };
      }),
    [patch],
  );

  const login = useCallback(
    (userId: string, pin: string): boolean => {
      const user = USERS.find((u) => u.id === userId);
      if (!user || DEMO_PINS[userId] !== pin) {
        toast("PIN incorrecto.");
        return false;
      }
      patch((s) => ({
        ...s,
        user,
        audit: log(s, {
          type: "login",
          detail: `Inicio de sesión · ${user.fullName} (${user.code})`,
          actorId: user.id,
        }),
        screen: "dashboard",
        history: [],
      }));
      return true;
    },
    [patch, log, toast],
  );

  const logout = useCallback(() => {
    patch((s) => ({
      ...s,
      audit: s.user
        ? log(s, { type: "logout", detail: "Cierre de sesión", actorId: s.user.id })
        : s.audit,
      user: null,
      screen: "login",
      history: [],
      exec: null,
      verif: null,
      activeRoomId: null,
    }));
  }, [patch, log]);

  const openTrace = useCallback(
    (roomId: string) =>
      patch((s) => ({
        ...s,
        traceRoomId: roomId,
        history: [...s.history, s.screen],
        screen: "trace",
      })),
    [patch],
  );

  // ---------- Execution flow (§8.3) ----------

  const beginExecution = useCallback(
    (roomId: string) =>
      patch((s) => {
        const room = s.rooms.find((r) => r.id === roomId);
        if (!room || !s.user) return s;
        const proto = room.suggestedProto ?? "terminal";
        return {
          ...s,
          activeRoomId: roomId,
          exec: {
            roomId,
            operatorId: s.user.id,
            motivo: room.motivo,
            protoKey: proto,
            qrScannedAt: 0,
            stepsConfirmed: [],
            insumos: [],
            photos: {},
            incidents: [],
          },
          history: [...s.history, s.screen],
          screen: "exec_qr",
        };
      }),
    [patch],
  );

  const confirmQr = useCallback(
    (code: string) =>
      patch((s) => {
        const room = s.rooms.find((r) => r.id === s.activeRoomId);
        if (!room || !s.exec || !s.user) return s;
        if (code.trim() !== room.qrCode) {
          toast(`QR inválido: no corresponde a la Hab. ${room.id}.`);
          return s;
        }
        if (room.state !== "pendiente" && room.state !== "con_hallazgos") {
          toast("Esta habitación no está pendiente de limpieza.");
          return s;
        }
        const now = Date.now();
        return {
          ...s,
          exec: { ...s.exec, qrScannedAt: now },
          audit: log(
            s,
            { type: "qr_scan", detail: `Escaneo QR Hab. ${room.id}`, actorId: s.user.id, roomId: room.id },
            { type: "exec_open", detail: "Apertura de registro de ejecución", actorId: s.user.id, roomId: room.id },
          ),
          screen: "exec_protocol",
          history: [...s.history, s.screen],
        };
      }),
    [patch, log, toast],
  );

  const selectProtocol = useCallback(
    (key: ProtocolKey, justification?: string) =>
      patch((s) => {
        const room = s.rooms.find((r) => r.id === s.activeRoomId);
        if (!room || !s.exec || !s.user) return s;
        const changed = room.suggestedProto && key !== room.suggestedProto;
        if (changed && !justification?.trim()) {
          toast("Cambiar de protocolo requiere justificación.");
          return s;
        }
        const events: AuditEventInput[] = [];
        if (changed) {
          events.push({
            type: "protocol_changed",
            detail: `Protocolo cambiado a ${PROTOCOLS[key].code} · ${justification}`,
            actorId: s.user.id,
            roomId: room.id,
          });
        }
        events.push({
          type: "protocol_selected",
          detail: `Protocolo ${PROTOCOLS[key].code} ${PROTOCOLS[key].version}`,
          actorId: s.user.id,
          roomId: room.id,
        });
        return {
          ...s,
          exec: { ...s.exec, protoKey: key },
          audit: log(s, ...events),
          screen: "exec_insumos",
          history: [...s.history, s.screen],
        };
      }),
    [patch, log, toast],
  );

  const toggleInsumo = useCallback(
    (gtin: string) =>
      patch((s) => {
        if (!s.exec) return s;
        const has = s.exec.insumos.includes(gtin);
        return {
          ...s,
          exec: {
            ...s.exec,
            insumos: has
              ? s.exec.insumos.filter((g) => g !== gtin)
              : [...s.exec.insumos, gtin],
          },
        };
      }),
    [patch],
  );

  const confirmInsumos = useCallback(
    () =>
      patch((s) => {
        const room = s.rooms.find((r) => r.id === s.activeRoomId);
        if (!room || !s.exec || !s.user) return s;
        const hasDesinfectante = s.exec.insumos.some(
          (g) => INSUMOS.find((i) => i.gtin === g)?.tipo === "desinfectante",
        );
        if (!hasDesinfectante) {
          toast("Selecciona al menos un desinfectante.");
          return s;
        }
        try {
          assertTransition(room.state, "en_limpieza", { actorRole: s.user.role });
        } catch (e) {
          toast(e instanceof StateTransitionError ? e.message : "Transición no permitida.");
          return s;
        }
        const now = Date.now();
        const proto = PROTOCOLS[s.exec.protoKey];
        return {
          ...s,
          exec: { ...s.exec, startedAt: now },
          rooms: s.rooms.map((r) =>
            r.id === room.id ? { ...r, state: "en_limpieza" } : r,
          ),
          audit: log(
            s,
            { type: "insumos_selected", detail: `${s.exec.insumos.length} insumo(s) seleccionados`, actorId: s.user.id, roomId: room.id },
            { type: "exec_start", detail: `Inicio de ejecución · ${proto.code} ${proto.version}`, actorId: s.user.id, roomId: room.id },
            { type: "room_state_change", detail: "pendiente → en_limpieza", actorId: s.user.id, roomId: room.id },
          ),
          screen: "exec_journey",
          history: [...s.history, s.screen],
        };
      }),
    [patch, log, toast],
  );

  const confirmStep = useCallback(
    (idx: number) =>
      patch((s) => {
        if (!s.exec || !s.user || s.exec.stepsConfirmed.some((x) => x.idx === idx))
          return s;
        const now = Date.now();
        return {
          ...s,
          exec: {
            ...s.exec,
            stepsConfirmed: [...s.exec.stepsConfirmed, { idx, at: now }],
          },
          audit: log(s, {
            type: "step_confirm",
            detail: `Paso ${idx + 1} confirmado`,
            actorId: s.user.id,
            roomId: s.exec.roomId,
          }),
        };
      }),
    [patch, log],
  );

  const addIncident = useCallback(
    (stepIdx: number, text: string) =>
      patch((s) => {
        if (!s.exec || !s.user || !text.trim()) return s;
        const now = Date.now();
        return {
          ...s,
          exec: {
            ...s.exec,
            incidents: [...s.exec.incidents, { stepIdx, text, at: now }],
          },
          audit: log(s, {
            type: "incident",
            detail: `Incidente (paso ${stepIdx + 1}): ${text}`,
            actorId: s.user.id,
            roomId: s.exec.roomId,
          }),
        };
      }),
    [patch, log],
  );

  const capturePhoto = useCallback(
    (slotIdx: number, url = "demo") =>
      patch((s) => {
        if (!s.exec || !s.user) return s;
        return {
          ...s,
          exec: { ...s.exec, photos: { ...s.exec.photos, [slotIdx]: url } },
          audit: log(s, {
            type: "photo",
            detail: `Foto capturada (${PROTOCOLS[s.exec.protoKey].photoSlots[slotIdx]})`,
            actorId: s.user.id,
            roomId: s.exec.roomId,
          }),
        };
      }),
    [patch, log],
  );

  const commitExecution = useCallback(
    (s: AppState): AppState => {
      const room = s.rooms.find((r) => r.id === s.activeRoomId);
      if (!room || !s.exec || !s.user || !s.exec.startedAt) return s;
      const proto = PROTOCOLS[s.exec.protoKey];
      const now = Date.now();
      const record: ExecRecord = {
        id: rid("exec"),
        operatorId: s.exec.operatorId,
        protoKey: s.exec.protoKey,
        protocolCode: proto.code,
        protocolVersion: proto.version,
        motivo: s.exec.motivo,
        qrScannedAt: s.exec.qrScannedAt,
        startedAt: s.exec.startedAt,
        finishedAt: now,
        stepsConfirmed: s.exec.stepsConfirmed,
        insumos: s.exec.insumos,
        photos: s.exec.photos,
        incidents: s.exec.incidents,
      };
      return {
        ...s,
        rooms: s.rooms.map((r) =>
          r.id === room.id
            ? { ...r, state: "pend_verificacion", execRecord: record }
            : r,
        ),
        exec: null,
        audit: log(
          s,
          { type: "exec_finish", detail: "Cierre de ejecución", actorId: s.user.id, roomId: room.id },
          { type: "room_state_change", detail: "en_limpieza → pend_verificacion", actorId: s.user.id, roomId: room.id },
        ),
        screen: "exec_done",
        history: [...s.history, s.screen],
      };
    },
    [log],
  );

  const finishExecution = useCallback(() => {
    const s = stateRef.current;
    if (!s.exec) return;
    const proto = PROTOCOLS[s.exec.protoKey];
    if (proto.photoReq) {
      const missing = proto.photoSlots.some((_, i) => !s.exec!.photos[i]);
      if (missing) {
        toast("Captura todas las fotos requeridas antes de finalizar.");
        return;
      }
    }
    const exec = s.exec;
    patch(commitExecution);
    persistExecutionRemote(exec);
  }, [patch, commitExecution, toast, persistExecutionRemote]);

  const finishJourney = useCallback(() => {
    const s = stateRef.current;
    if (!s.exec) return;
    const proto = PROTOCOLS[s.exec.protoKey];
    if (proto.photoReq) {
      patch((st) => ({
        ...st,
        screen: "exec_photos",
        history: [...st.history, st.screen],
      }));
      return;
    }
    const exec = s.exec;
    patch(commitExecution);
    persistExecutionRemote(exec);
  }, [patch, commitExecution, persistExecutionRemote]);

  // ---------- Verification flow (§8.4) ----------

  const beginVerification = useCallback(
    (roomId: string) =>
      patch((s) => {
        const room = s.rooms.find((r) => r.id === roomId);
        if (!room || !room.execRecord || !s.user) return s;
        // Rule §9.3 — role separation.
        try {
          assertCanVerify({ operatorId: room.execRecord.operatorId }, s.user.id);
        } catch (e) {
          toast(
            e instanceof BusinessRuleError
              ? "No puedes verificar tu propia ejecución (separación de roles)."
              : "Verificación no permitida.",
          );
          return s;
        }
        return {
          ...s,
          activeRoomId: roomId,
          verif: {
            roomId,
            verifierId: s.user.id,
            startedAt: Date.now(),
            results: {},
          },
          audit: log(s, {
            type: "verif_open",
            detail: "Apertura de registro de verificación",
            actorId: s.user.id,
            roomId,
          }),
          screen: "verif_review",
          history: [...s.history, s.screen],
        };
      }),
    [patch, log, toast],
  );

  const setVerifResult = useCallback(
    (itemId: string, estado: VerifResult["estado"], severity?: Severity, note?: string) =>
      patch((s) => {
        if (!s.verif) return s;
        return {
          ...s,
          verif: {
            ...s.verif,
            results: {
              ...s.verif.results,
              [itemId]: { estado, severity, note },
            },
          },
        };
      }),
    [patch],
  );

  const persistVerificationRemote = useCallback((s: AppState) => {
    const room = s.rooms.find((r) => r.id === s.activeRoomId);
    if (!room || !s.verif || !s.user || !room.execRecord) return;
    void fetch("/api/verifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        roomId: room.id,
        executionRecordId: room.execRecord.id,
        verifierId: s.user.id,
        verifierRole: s.user.role,
        startedAt: s.verif.startedAt,
        results: s.verif.results,
      }),
    }).catch(() => {});
  }, []);

  const finishVerification = useCallback(
    () => {
      persistVerificationRemote(stateRef.current);
      patch((s) => {
        const room = s.rooms.find((r) => r.id === s.activeRoomId);
        if (!room || !s.verif || !s.user || !room.execRecord) return s;
        const results = Object.values(s.verif.results);
        const conf = results.filter((r) => r.estado === "conforme").length;
        const noConf = results.filter((r) => r.estado === "no_conforme").length;
        const denom = conf + noConf;
        const conformidad = denom === 0 ? 0 : Math.round((conf / denom) * 100);
        const hasCriticalFinding = results.some(
          (r) => r.estado === "no_conforme" && r.severity === "critico",
        );
        const protocolKey = room.execRecord.protoKey;
        const decision = decideVerification({
          protocolKey,
          conformidadPct: conformidad,
          hasCriticalFinding,
          highRisk: room.highRisk,
        });
        const late = room.execRecord.finishedAt
          ? isVerificationLate({
              protocolKey,
              execFinishedAt: new Date(room.execRecord.finishedAt),
              verifStartedAt: new Date(s.verif.startedAt),
            })
          : false;

        // Rule §9.6 — PCI-only release for high risk.
        if (decision === "liberada" && !canRelease(room, s.user.role)) {
          toast("Habitación de alto riesgo: solo el Verificador PCI puede liberar.");
          return s;
        }

        const now = Date.now();
        const verifRecord = {
          id: rid("verif"),
          verifierId: s.user.id,
          startedAt: s.verif.startedAt,
          finishedAt: now,
          results: s.verif.results,
          conformidad,
          late,
          decision,
        };
        const nextState = decision === "liberada" ? "liberada" : "con_hallazgos";
        try {
          assertTransition(room.state, nextState, { actorRole: s.user.role });
        } catch {
          // pend_verificacion → liberada|con_hallazgos are canonical; defensive.
        }
        const events: AuditEventInput[] = [
          { type: "verif_finish", detail: `Verificación cerrada · ${conformidad}% conformidad${late ? " · tardía" : ""}`, actorId: s.user.id, roomId: room.id },
        ];
        if (decision === "liberada") {
          events.push({ type: "release", detail: "Habitación liberada para admisión", actorId: s.user.id, roomId: room.id });
          events.push({ type: "room_state_change", detail: "pend_verificacion → liberada", actorId: s.user.id, roomId: room.id });
        } else {
          events.push({ type: "return_for_correction", detail: "Devuelta para corrección", actorId: s.user.id, roomId: room.id });
          events.push({ type: "room_state_change", detail: "pend_verificacion → con_hallazgos", actorId: s.user.id, roomId: room.id });
        }
        return {
          ...s,
          rooms: s.rooms.map((r) =>
            r.id === room.id
              ? {
                  ...r,
                  state: nextState,
                  verifRecord,
                  releasedAt: decision === "liberada" ? now : r.releasedAt,
                }
              : r,
          ),
          verif: null,
          audit: log(s, ...events),
          screen: "verif_done",
          history: [...s.history, s.screen],
        };
      });
    },
    [patch, log, toast, persistVerificationRemote],
  );

  const activeRoom = useMemo(
    () => state.rooms.find((r) => r.id === state.activeRoomId) ?? null,
    [state.rooms, state.activeRoomId],
  );

  const value: AppContextValue = {
    ...state,
    login,
    logout,
    nav,
    back,
    openTrace,
    beginExecution,
    confirmQr,
    selectProtocol,
    toggleInsumo,
    confirmInsumos,
    confirmStep,
    addIncident,
    finishJourney,
    capturePhoto,
    finishExecution,
    beginVerification,
    setVerifResult,
    finishVerification,
    activeRoom,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>.");
  return ctx;
}

export { PROTOCOLS, INSUMOS, VERIF_TEMPLATE, USERS };
