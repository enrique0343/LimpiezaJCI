"use client";

import { useState } from "react";
import { Lock, LogIn } from "lucide-react";
import { useApp, USERS } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/seed";
import { Button, Modal } from "@/components/ui";

// Login (§8.1): visual profile selector (demo) → PIN. No persistent session.
export function Login() {
  const { login } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [pin, setPin] = useState("");

  const submit = () => {
    if (selected && login(selected, pin)) {
      setSelected(null);
      setPin("");
    } else {
      setPin("");
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-gris-bg">
      <header className="bg-negro px-4 py-3 text-white">
        <div className="text-[13px] font-bold">Limpieza con Trazabilidad JCI</div>
        <div className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-[#cfcfcf]">
          Avante Complejo Hospitalario
        </div>
      </header>

      <main className="flex-1 px-4 pt-5">
        <p className="mb-[18px] text-[12.5px] leading-relaxed text-gris-med">
          Selecciona tu perfil e ingresa tu PIN. El acceso es obligatorio antes
          de cualquier acción operativa y no hay sesión persistente.
        </p>
        <p className="mb-[10px] text-[11px] font-medium uppercase tracking-[0.08em] text-gris">
          Perfiles
        </p>

        {USERS.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => setSelected(u.id)}
            className="mb-[10px] flex w-full items-center gap-3 rounded-[4px] border border-gris-cl bg-white p-[14px] text-left active:scale-[0.99]"
          >
            <span className="flex size-[38px] items-center justify-center rounded-full border border-gris-cl bg-gris-bg2 text-sm font-bold text-negro">
              {u.initials}
            </span>
            <span>
              <span className="block text-sm font-bold">{u.fullName}</span>
              <span className="mt-0.5 block text-[10.5px] uppercase tracking-[0.06em] text-gris-med">
                {ROLE_LABEL[u.role]} · {u.area}
              </span>
            </span>
            <span className="ml-auto rounded-[3px] border border-gris-cl px-[7px] py-[3px] text-[10px] text-gris">
              {u.code}
            </span>
          </button>
        ))}

        <p className="mt-4 text-center text-[10px] leading-relaxed text-gris-med">
          PINs de demo: María <b className="text-gris">1234</b> · José{" "}
          <b className="text-gris">2345</b> · Arely{" "}
          <b className="text-gris">3456</b> · Dra. Cruz{" "}
          <b className="text-gris">4567</b>
        </p>
      </main>

      <Modal
        open={selected !== null}
        onClose={() => {
          setSelected(null);
          setPin("");
        }}
        title={
          <span className="flex items-center gap-2">
            <Lock className="size-4" aria-hidden />
            Ingresar PIN
          </span>
        }
      >
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="PIN de 4–6 dígitos"
          className="w-full rounded-[4px] border border-gris-cl px-3 py-3 text-center text-lg tracking-[0.3em] outline-none focus:border-gris"
        />
        <Button className="mt-4 w-full" onClick={submit}>
          <LogIn /> Iniciar sesión
        </Button>
      </Modal>
    </div>
  );
}
