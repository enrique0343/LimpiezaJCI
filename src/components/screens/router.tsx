"use client";

import { useApp } from "@/lib/store";
import { Shell } from "./shell";
import { Login } from "./login";
import { Dashboard } from "./dashboard";
import {
  ExecQR,
  ExecProtocol,
  ExecInsumos,
  ExecJourney,
  ExecPhotos,
  ExecDone,
} from "./execution";
import { VerifReview, VerifJourney, VerifDone } from "./verification";
import { Trace } from "./trace";

const TITLES: Record<string, string> = {
  exec_qr: "Anclaje físico (QR)",
  exec_protocol: "Selección de protocolo",
  exec_insumos: "Selección de insumos",
  exec_journey: "Ejecución guiada",
  exec_photos: "Captura fotográfica",
  exec_done: "Ejecución cerrada",
  verif_review: "Revisión de ejecución",
  verif_journey: "Verificación",
  verif_done: "Verificación cerrada",
  trace: "Bitácora",
};

export function AppRouter() {
  const { screen } = useApp();

  if (screen === "login") return <Login />;

  const body = (() => {
    switch (screen) {
      case "dashboard":
        return <Dashboard />;
      case "exec_qr":
        return <ExecQR />;
      case "exec_protocol":
        return <ExecProtocol />;
      case "exec_insumos":
        return <ExecInsumos />;
      case "exec_journey":
        return <ExecJourney />;
      case "exec_photos":
        return <ExecPhotos />;
      case "exec_done":
        return <ExecDone />;
      case "verif_review":
        return <VerifReview />;
      case "verif_journey":
        return <VerifJourney />;
      case "verif_done":
        return <VerifDone />;
      case "trace":
        return <Trace />;
      default:
        return <Dashboard />;
    }
  })();

  return (
    <Shell
      title={TITLES[screen] ?? "Limpieza con Trazabilidad"}
      showBack={screen !== "dashboard"}
    >
      {body}
    </Shell>
  );
}
