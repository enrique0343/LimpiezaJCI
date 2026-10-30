"use client";

import { useApp } from "@/lib/store";
import { Shell } from "./shell";
import { Login } from "./login";
import { Dashboard } from "./dashboard";
import {
  ExecScan,
  ExecProtocol,
  ExecInsumos,
  ExecJourney,
  ExecPhotos,
  ExecDone,
} from "./execution";
import { VerifReview, VerifJourney, VerifDone } from "./verification";
import { Trace } from "./trace";
import { Reportes } from "./reportes";

const TITLES: Record<string, string> = {
  exec_qr: "Anclaje físico (DataMatrix)",
  exec_protocol: "Selección de protocolo",
  exec_insumos: "Selección de insumos",
  exec_journey: "Ejecución guiada",
  exec_photos: "Captura fotográfica",
  exec_done: "Ejecución cerrada",
  verif_review: "Revisión de ejecución",
  verif_journey: "Verificación",
  verif_done: "Verificación cerrada",
  trace: "Bitácora",
  reportes: "Reportes e indicadores",
};

const WIDE = new Set(["dashboard", "reportes", "trace"]);

export function AppRouter() {
  const { screen } = useApp();

  if (screen === "login") return <Login />;

  const body = (() => {
    switch (screen) {
      case "dashboard":
        return <Dashboard />;
      case "exec_qr":
        return <ExecScan />;
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
      case "reportes":
        return <Reportes />;
      default:
        return <Dashboard />;
    }
  })();

  return (
    <Shell
      title={TITLES[screen] ?? "Limpieza con Trazabilidad"}
      showBack={screen !== "dashboard"}
      wide={WIDE.has(screen)}
    >
      {body}
    </Shell>
  );
}
