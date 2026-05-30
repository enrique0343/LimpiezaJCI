"use client";

import { ToastProvider } from "@/components/ui";
import { AppProvider } from "@/lib/store";
import { AppRouter } from "@/components/screens/router";

// Demo build of the full operational flow (login → dashboard → ejecución →
// verificación → bitácora) running on seed data (spec §15). The §9 business
// rules are enforced via src/domain; persistence is in-memory for the demo and
// swaps to Prisma/Hyperdrive later behind the same shapes.
export default function Home() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </ToastProvider>
  );
}
