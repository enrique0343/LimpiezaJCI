# LimpiezaJCI — Sistema de Limpieza con Trazabilidad JCI

Aplicación para **Avante Complejo Hospitalario** (`GO-PRY-001-2026`) que vuelve
**auditable cada evento de limpieza** en habitaciones y áreas clínicas,
encadenando Ejecución → Verificación independiente → Liberación. Es una
pre-condición de defensibilidad para la auditoría **JCI 8ª edición**
(norma PCI.04.00, ME #4).

> Idioma de producto: **español (es-SV)**. Mobile-first, offline-first (PWA).

## Stack

- **Next.js 15** (App Router) + **TypeScript** estricto, desplegado en
  **Cloudflare Workers** vía el adaptador **OpenNext** (`@opennextjs/cloudflare`).
- **PostgreSQL** a través de **Cloudflare Hyperdrive**, con **Prisma**
  (driver adapter `@prisma/adapter-pg`).
- **Tailwind CSS v4** con los design tokens Avante.
- **R2** (fotos), **KV** (sesiones), **Queues** + **Cron** (sync/notificaciones).

El stack completo y su justificación están en `docs/GO-PRY-001-2026-spec.md` §11
y en `CLAUDE.md`.

## Requisitos

- Node.js 20+ (probado con 22) y npm.
- Una cuenta de Cloudflare (para `preview`/`deploy`).
- Un PostgreSQL accesible (local o gestionado) para desarrollo.

## Desarrollo

```bash
npm install                # instala deps y corre `prisma generate`
cp .env.example .env       # configura DATABASE_URL local
npm run dev                # iteración rápida (servidor de Next.js)
```

Para correr/probar en el runtime real de Workers (`workerd`):

```bash
npm run preview            # build con OpenNext + preview local en workerd
```

## Comandos

| Tarea                         | Comando            |
| ----------------------------- | ------------------ |
| Servidor de desarrollo        | `npm run dev`      |
| Build (Next.js)               | `npm run build`    |
| Lint                          | `npm run lint`     |
| Preview en workerd (OpenNext) | `npm run preview`  |
| Deploy a Cloudflare           | `npm run deploy`   |
| Generar cliente Prisma        | `npm run db:generate` |
| Migración de desarrollo       | `npm run db:migrate`  |
| Tipos de bindings de Workers  | `npm run cf-typegen`  |

## Despliegue (Cloudflare)

Antes del primer `npm run deploy`, provisiona los bindings y descoméntalos en
`wrangler.jsonc`:

```bash
wrangler hyperdrive create limpieza-jci-db --connection-string="postgres://..."
wrangler r2 bucket create limpieza-jci-fotos
wrangler kv namespace create SESSIONS
wrangler queues create limpieza-jci-sync
```

> ⚠️ **Residencia de datos:** Cloudflare es nube pública sin región en El
> Salvador/LATAM. Es defendible (las fotos no contienen PII — spec §9.8) pero
> requiere firma de Gerencia/PCI. Ver la salvedad en `docs/...-spec.md` §11.1.

## Estructura

```
.
├── docs/        # Brief autoritativo (GO-PRY-001-2026-spec.md) — SOURCE OF TRUTH
├── prototype/   # Prototipo visual/flujo (HTML vanilla) — referencia exacta de UI
├── prisma/      # schema.prisma (modelo de dominio §7)
├── src/
│   ├── app/         # App Router. `/` = flujo demo; `/kit` = muestrario de componentes
│   ├── components/  # ui/ (kit Avante §10.4) + screens/ (pantallas operativas)
│   ├── domain/      # Reglas §9 puras y testeadas (state machine, separación de roles, bitácora)
│   └── lib/         # store.tsx (estado del flujo), seed.ts (§15), db.ts (Prisma/Hyperdrive), format/cn
├── tests/domain/       # Pruebas Vitest del dominio (≥80% cobertura, §14)
├── wrangler.jsonc      # Config de Cloudflare Workers + bindings
└── open-next.config.ts # Config del adaptador OpenNext
```

> **Flujo demo:** la ruta `/` ejecuta el ciclo completo (login → dashboard →
> ejecución → verificación → bitácora) sobre datos semilla (§15) con estado **en
> memoria** y las reglas §9 aplicadas vía `src/domain`. La persistencia real
> (Prisma/Hyperdrive), auth (Auth.js/KV) y offline (Serwist) quedan pendientes.
> PINs de demo: María `1234` · José `2345` · Arely `3456` · Dra. Cruz `4567`.

Las reglas de negocio **no negociables** (separación de roles, bitácora
append-only, liberación PCI en alto riesgo, etc.) están en `CLAUDE.md` y en la
spec §9. **No deben debilitarse.**
