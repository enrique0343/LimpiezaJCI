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
- **Cloudflare D1** (SQLite serverless) con **Prisma** (driver adapter
  `@prisma/adapter-d1`) — base de datos nativa, sin servidor externo.
- **Tailwind CSS v4** con los design tokens Avante.
- **R2** (fotos), **KV** (sesiones), **Cron** (KPIs); **Queues** (sync) en plan pago.

El stack completo y su justificación están en `docs/GO-PRY-001-2026-spec.md` §11
y en `CLAUDE.md`.

## Requisitos

- Node.js 20+ (probado con 22) y npm.
- Una cuenta de Cloudflare (para `preview`/`deploy`).
- (Opcional) SQLite local para herramientas Prisma; en producción es D1.

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

Los recursos ya están aprovisionados y enlazados en `wrangler.jsonc`:

| Recurso | Nombre | Binding |
| ------- | ------ | ------- |
| D1 (base de datos) | `limpieza-jci-db` | `DB` |
| R2 (fotos) | `limpieza-jci-fotos` | `FOTOS` |
| KV (sesiones) | `limpieza-jci-sessions` | `SESSIONS` |

El schema y los datos semilla (§15) ya fueron aplicados a D1. Para verificar la
conexión real a D1 en el Worker, la ruta `GET /api/health` devuelve los conteos.

```bash
npm run deploy             # build OpenNext + deploy a Cloudflare Workers
```

Migraciones de schema: `npx prisma migrate diff --from-empty
--to-schema-datamodel prisma/schema.prisma --script` y aplicar el SQL a D1
(`wrangler d1 execute limpieza-jci-db --file=...` o el dashboard).

> **Queues** (sync/notificaciones, §11.3/§12.3) requieren el plan **Workers
> Paid**; quedan comentadas en `wrangler.jsonc` hasta habilitarlo.

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
│   └── lib/         # store.tsx (estado del flujo), seed.ts (§15), db.ts (Prisma/D1), format/cn
├── tests/domain/       # Pruebas Vitest del dominio (≥80% cobertura, §14)
├── wrangler.jsonc      # Config de Cloudflare Workers + bindings
└── open-next.config.ts # Config del adaptador OpenNext
```

> **Flujo demo:** la ruta `/` ejecuta el ciclo completo (login → dashboard →
> ejecución → verificación → bitácora) sobre datos semilla (§15) con estado **en
> memoria** y las reglas §9 aplicadas vía `src/domain`. La persistencia real
> (API + D1), auth (Auth.js/KV) y offline (Serwist) quedan pendientes.
> PINs de demo: María `1234` · José `2345` · Arely `3456` · Dra. Cruz `4567`.

Las reglas de negocio **no negociables** (separación de roles, bitácora
append-only, liberación PCI en alto riesgo, etc.) están en `CLAUDE.md` y en la
spec §9. **No deben debilitarse.**
