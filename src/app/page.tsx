// Placeholder landing. The real flow (login → dashboard → ejecución →
// verificación → bitácora) is built screen-by-screen against the prototype
// at prototype/limpieza-trazabilidad-jci-v2.html (spec §8).
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs uppercase tracking-widest text-gris-med">
        Avante Complejo Hospitalario · GO-PRY-001-2026
      </p>
      <h1 className="max-w-xl text-2xl font-semibold text-azul-marino">
        Sistema de Limpieza con Trazabilidad JCI
      </h1>
      <p className="max-w-md text-sm text-gris">
        Andamiaje inicial (Next.js 15 · Cloudflare Workers vía OpenNext). El
        flujo operativo se implementará pantalla por pantalla contra el
        prototipo y la especificación.
      </p>
    </main>
  );
}
