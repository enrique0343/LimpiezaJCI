# CLAUDE.md

This file provides guidance to Claude Code (and other AI assistants) when working
with code in this repository.

> **Status: Demo flow implemented (in-memory).**
> Next.js 15 + Cloudflare (OpenNext) scaffold builds; the domain (§9 rules) is
> pure + tested; the Avante UI kit is built; and the full operational flow
> (login → dashboard → ejecución → verificación → bitácora) runs at `/` over
> **seed data with in-memory state** (no live DB/auth yet). Remaining for
> production: real Auth.js/KV sessions, Prisma/Hyperdrive persistence, the sync
> layer (Queues/IndexedDB), PWA/offline, and PDF export.

## Project Overview

**LimpiezaJCI** (project code `GO-PRY-001-2026`) — *Sistema de Limpieza con
Trazabilidad JCI* for **Avante Complejo Hospitalario**.

- **What it does:** Makes **every cleaning event in patient rooms and clinical
  areas auditable**, chaining an *Execution Record* (who cleaned, against which
  protocol, with which supplies) → an *independent Verification Record* (who
  validated) → an explicit *Release* of the room for the next admission.
- **Why it exists:** It is a defensibility precondition for the next **JCI 8th
  edition** accreditation audit, directly answering standard **PCI.04.00,
  Measurable Element #4** (the hospital monitors cleaning/disinfection processes
  and uses the data to drive change). It adds a fourth, digital-evidence method
  on top of JCI's recognized methods (patient feedback, ATP/fluorescent markers,
  direct observation).
- **Who it's for:** Servicios Generales operators, supervisors, the Infection
  Prevention & Control (PCI) committee, and management/auditors (read-only).
- **Language:** Spanish (es-SV). Single tenant (Avante) in v1.

The full, authoritative brief lives at **`docs/GO-PRY-001-2026-spec.md`**. Read
it before making non-trivial decisions — the sections below summarize it but the
spec governs.

## Repository Structure

```
.
├── docs/
│   └── GO-PRY-001-2026-spec.md           # Authoritative development brief (es). SOURCE OF TRUTH.
├── prototype/
│   └── limpieza-trazabilidad-jci-v2.html # Single-file vanilla-JS visual + flow prototype.
├── prisma/
│   └── schema.prisma                     # Domain model (§7) + data rules (§7.3).
├── src/
│   ├── app/                              # Next.js App Router. `/` = full demo flow; `/kit` = UI kit showcase.
│   ├── components/
│   │   ├── ui/                           # Avante UI kit (§10.4): Button, Card, StatePill, Badge, StepBlock, Stepper, Timer, Modal, PhotoSlot, Toast.
│   │   └── screens/                      # Operational screens: shell, login, dashboard, execution, verification, trace, router.
│   ├── domain/                           # Pure, framework-free §9 rules (state machine, role sep, audit, decisions).
│   └── lib/
│       ├── cn.ts                         # className joiner.
│       ├── db.ts                         # PrismaClient over Hyperdrive (per-request, workerd).
│       ├── types.ts                      # Runtime (demo) types mirroring §7.
│       ├── seed.ts                       # Demo seed data (§15): users, rooms, protocols, insumos, verif template.
│       ├── format.ts                     # es-SV time formatting (UTC→America/El_Salvador for display).
│       └── store.tsx                     # Client AppProvider: flow state + §9 enforcement + audit logging.
├── tests/
│   └── domain/                           # Vitest unit tests for src/domain (spec §14: ≥80% coverage).
├── public/                               # Static assets.
├── next.config.ts                        # Next config + initOpenNextCloudflareForDev().
├── open-next.config.ts                   # OpenNext (Cloudflare) adapter config.
├── wrangler.jsonc                        # Workers config + bindings (HYPERDRIVE/R2/KV/Queues/cron).
├── cloudflare-env.d.ts                   # Types for the Workers bindings (regen: npm run cf-typegen).
├── .env.example / .dev.vars.example      # Local DB URL / workerd secrets templates.
├── README.md                             # Human-facing setup & commands.
└── CLAUDE.md                             # This file.
```

The full operational flow (login → dashboard → ejecución → verificación →
bitácora) is implemented at `/` as a **client-side demo** over seed data:
`src/lib/store.tsx` holds the flow state and enforces the §9 rules by calling
`src/domain` (no inline rule logic), logging every step to an append-only audit
array. **Persistence is in-memory only** — wire it to Prisma/Hyperdrive (and
real auth/sessions) behind the same shapes for production. Keep this tree in
sync as you add them. **Tailwind v4** (tokens in `src/app/globals.css`,
not a `tailwind.config`). The Prisma client is generated to `node_modules` on
`postinstall` (`prisma generate`).

### The prototype (`prototype/limpieza-trazabilidad-jci-v2.html`)

A self-contained HTML file (CSS in `<style>`, app in one `<script>`, no build
step, no framework — plain DOM + a `render()` switch over a `screen` variable).
It is the **exact visual and flow reference**: open it in a browser to see the
intended UI, the Avante design tokens, the screen-by-screen flow, the room state
machine, seed data (users, rooms, protocols, supplies, verification template),
and the append-only audit log in action. When implementing a screen or
component, match the prototype unless the spec says otherwise.

## Development Workflow

| Task                          | Command               |
| ----------------------------- | --------------------- |
| Install deps (runs `generate`)| `npm install`         |
| Run dev server (fast)         | `npm run dev`         |
| Build (Next.js)               | `npm run build`       |
| Lint                          | `npm run lint`        |
| Run tests                     | `npm test`            |
| Tests + coverage              | `npm run test:coverage` |
| Preview in `workerd` (OpenNext)| `npm run preview`    |
| Deploy to Cloudflare          | `npm run deploy`      |
| Generate Prisma client        | `npm run db:generate` |
| Dev migration                 | `npm run db:migrate`  |
| Regenerate binding types      | `npm run cf-typegen`  |

Tests use **Vitest** (`tests/`, alias `@/` → `src/`). Coverage is gated at ≥80%
on `src/domain` (spec §14). Keep new domain logic pure and covered.

- `npm run dev` uses the Next.js dev server (fast). For `workerd`-accurate
  behavior (bindings, runtime quirks), use `npm run preview`.
- Set `DATABASE_URL` (copy `.env.example` → `.env`) for local Prisma/`next dev`;
  in production the connection comes from the `HYPERDRIVE` binding.
- To view the prototype, just open the HTML file in a browser — no server needed.

**Before committing application code**, run `npm run lint` and the build (and
tests, once they exist) and ensure they pass.

## Stack — Cloudflare target (spec §11)

**Platform decision (per spec §18.4, confirm with Edwin Martínez):** the app
targets **Cloudflare** for deployment. This supersedes the brief's original
self-hosted/Docker recommendation — see the **data-residency caveat** below.
The **baseline is installed** (Next.js 15.5 pinned for OpenNext compatibility,
Tailwind v4, Prisma); the items below describe what's wired vs. still to add.

- **App / framework:** **Next.js 15** (App Router) + **strict TypeScript**,
  deployed to **Cloudflare Workers** via the **OpenNext adapter**
  (`@opennextjs/cloudflare`). The Workers runtime is `workerd`, **not Node** —
  enable `nodejs_compat` and a recent `compatibility_date` in `wrangler.jsonc`.
  Shipped as an **offline-first PWA** (rooms have inconsistent WiFi; operators
  must complete the full flow offline and sync on reconnect).
- **UI:** **Tailwind CSS** with the Avante design tokens + **shadcn/ui**
  (restyled to Avante) + **lucide-react** icons. **React Hook Form + Zod** for
  forms/validation; **TanStack Query** for server state; **Serwist** for the
  service worker; client-side **IndexedDB** for offline drafts/photos.
- **Database:** **PostgreSQL 16+** (kept for audit defensibility), accessed from
  Workers through **Cloudflare Hyperdrive** (connection pooling/acceleration).
  **Prisma** as ORM via the **driver adapter** `@prisma/adapter-pg` over
  `env.HYPERDRIVE.connectionString`. Managed Postgres (Neon / Prisma Postgres /
  self-hosted) — place it as close to es-SV as the provider allows.
- **Auth:** **Auth.js / NextAuth** (Credentials, PIN). **Native `argon2` does
  NOT run on Workers** — hash PINs with **argon2id via WASM (`hash-wasm`)** or
  PBKDF2 via Web Crypto. No persistent sessions (shared devices), 30-min
  timeout — keep short-lived sessions in **Workers KV**.
- **Photos:** store in **Cloudflare R2** (S3-compatible). **`sharp` does NOT run
  on Workers** — resize/optimize with **Cloudflare Images** or compress
  client-side before upload.
- **QR:** `html5-qrcode`/`@zxing/browser` (scan) + `qrcode` (generation) —
  client-side, unchanged.
- **Async / scheduled:** **Cloudflare Queues** for sync/conflict handling and
  notification fan-out; **Cron Triggers** for daily KPI summaries.
- **Tooling:** **Wrangler** for config/bindings/deploy. `wrangler dev` /
  `opennextjs-cloudflare preview` for `workerd`-accurate previews; `next dev`
  for fast iteration. Bindings: `HYPERDRIVE`, R2 bucket, KV, Queues.

> **⚠️ Data-residency caveat (governance, not code).** Spec §11.1 preferred
> self-hosting on Avante infra "for clinical-data considerations." Cloudflare is
> public cloud with no El Salvador/LATAM region. This is defensible (photos
> carry no PII; surfaces/equipment only — §9.8) but is a compliance decision
> that must be signed off, ideally with the **Data Localization Suite** and R2
> jurisdiction restrictions documented. Surface this; don't bury it.

## Domain Model (see spec §7 for full TypeScript types)

- **Roles:** `operador`, `supervisor`, `pci`, `gerencia`. Auth is PIN/credential,
  30-min session timeout, **no persistent sessions** (shared devices), login
  required before any operational action.
- **Room state machine** (spec §5): `pendiente` → `en_limpieza` →
  `pend_verificacion` → (`liberada` | `con_hallazgos`). `con_hallazgos` returns
  to `pendiente` for re-execution. Transitions outside this diagram require the
  `gerencia` role and leave an audit event with justification.
- **Protocols (PNT)**, four supported, each versioned (spec §6):
  `PNT-LIM-001` rutina · `PNT-LIM-002` terminal post-alta · `PNT-LIM-003`
  aislamiento · `PNT-LIM-004` alto riesgo (UCI/quirófano). The **PNT version is
  frozen into the execution record** at start.
- **Supplies (Insumos)** carry GS1 GTIN + lot + dilution, enabling lot-level
  trace-back during outbreak investigations.
- **Records:** `ExecutionRecord`, `VerificationRecord`, and an **append-only
  `AuditEvent`** log.

## Critical Business Rules (spec §9 — NON-NEGOTIABLE)

These are compliance rules. **The code must make them impossible to bypass — not
even via a config flag.**

1. **No anonymous events.** Every audit write needs a non-null `actorId` (system
   events use `actorId='system'` with an explicit flag).
2. **No editable timestamps.** Timestamps are server-generated at event time;
   the client never dictates them. (In the offline path, the authenticated
   device records them locally and they sync — see spec §11.3.)
3. **Mandatory role separation.** The operator who closed an execution **cannot**
   verify that same execution. Enforce with a backend cross-check before opening
   the verification flow.
4. **No arbitrary state regressions** — only the §5 diagram transitions.
5. **PNT version frozen** into the record at execution start.
6. **PCI release required for high risk.** Rooms with `highRisk=true` or the
   `aislamiento`/`altoriesgo` protocols can only be released by the `pci` role;
   the SG supervisor sees the room but has no release button.
7. **Audit log is append-only.** No updates to `AuditEvent` in ORM or DB; a
   correction is a new event with `prevEventId` pointing at the original.
8. **Photo privacy.** Photos capture surfaces/equipment only — never patients,
   personal belongings, or documents. Show this notice at every capture.

Other data rules (spec §7.3): FKs `ON DELETE RESTRICT` (no cascade deletes),
timestamps stored in **UTC** (convert to `America/El_Salvador` only for display),
soft-delete (`deletedAt`) for Room and User — never hard-delete.

## Avante Visual System (spec §10 — MANDATORY)

- **Typography:** `'Century Gothic', 'CenturyGothic', 'AppleGothic', 'Questrial',
  sans-serif`.
- **Design tokens:** the prototype's `:root` variables are wired into
  `src/app/globals.css` (and exposed to Tailwind v4 via `@theme inline`, e.g.
  `text-azul-marino`, `bg-gris-bg`). Neutrals dominate the chrome; institutional
  accents `--azul-marino`, `--turquesa`, `--violeta` for data/hierarchy only.
- **Functional traffic-light colors** (`--verde`/`--ambar`/`--rojo`/`--rojo2`)
  are allowed **only** on interactive state buttons (Conforme/No conforme),
  finding severities, and room-state chips — a deliberate, documented *poka-yoke*
  exception. Do not use them on institutional documents bound for the Board, JCI,
  or regulators.
- No gradients, heavy shadows, 3D effects, or colored card top-borders. Lucide
  thin-line monochrome icons only. Border radius ≤ 4px. No emojis in chrome.
- **Mobile-first:** usable one-handed and with gloves; tap targets ≥ 44px;
  correct at 360×640 up to 480px wide.
- Reusable components (spec §10.4) live in `src/components/ui/` — `Button`,
  `Card`, `StatePill`, `Badge`, `StepBlock`, `Stepper`, `Timer`, `Modal`,
  `PhotoSlot`, `Toast` — matched to the prototype. See them rendered at `/kit`.
  `PhotoSlot` shows the §9.8 privacy notice by default. Reuse these before
  adding new primitives.

## Acceptance Criteria & Seed Data

The v1 acceptance criteria are in spec §14 (full terminal-cleaning flow offline,
enforced role separation, ≥15 audit events per cycle, QR rejection of invalid
codes, PCI-only release for high-risk rooms, PDF audit export, installable PWA,
≥80% domain test coverage, Lighthouse PWA ≥90). Seed data for demos is in §15.
Scope boundaries (in/out of v1, v2 roadmap) are in §13.

## Git & Branching Conventions

- **Default branch:** `main`.
- **Feature branches:** `feature/<short-desc>`, `fix/<short-desc>`, or
  `claude/<short-desc>` for AI-assisted work.
- **Commits:** clear, imperative mood (e.g. "Add execution timer").
- **Pull requests:** open a draft PR for review rather than pushing to `main`.

## Conventions for AI Assistants

- **The spec (`docs/GO-PRY-001-2026-spec.md`) governs.** When in doubt, read it.
  The prototype governs visual/flow detail. Don't contradict either silently.
- **Don't weaken the §9 business rules** to make something easier — they are the
  whole point of the system. If a rule blocks you, surface it; don't bypass it.
- **Don't invent files, frameworks, or commands.** Verify the current state
  before referencing it. **Next is pinned to 15.x** for OpenNext/Workers
  compatibility — do not bump to 16 without verifying adapter support.
- When you add tooling or change structure, **update this file (and `README.md`)
  in the same change** so they always reflect reality.
- Prefer conventions already present in the prototype and spec over introducing
  new ones. Keep this file concise and current.

## Next Steps

Governance preconditions still apply before production (spec §18 — PCI
co-leadership, audited base PNTs, budget/stack sign-off, updated internal
regulation) and the **data-residency sign-off** for Cloudflare (§11.1).

Done so far: scaffold, pure+tested `src/domain`, Avante UI kit, and the full
demo flow at `/` over seed data (in-memory). To productionize:

1. **Persistence:** provision Cloudflare bindings and uncomment them in
   `wrangler.jsonc` (`HYPERDRIVE`, R2 `FOTOS`, KV `SESSIONS`, `SYNC_QUEUE`); run
   `prisma migrate`; replace the in-memory store with API routes that read/write
   Prisma (keep enforcing rules via `src/domain`) and store photos in R2.
2. **Auth:** real Auth.js (Credentials/PIN, argon2id via `hash-wasm`) + KV
   sessions, replacing the demo PIN check in `src/lib/seed.ts`.
3. **Offline/PWA:** Serwist service worker + IndexedDB drafts; sync via Queues
   with `sync_conflict` handling (§11.3). PDF audit export (§8.5).
4. **Tests:** add integration/RTL tests for the screens + store (assert a full
   terminal cycle emits ≥15 audit events, role separation/PCI rules hold);
   extend the Vitest domain suite as rules grow (≥80% coverage, §14).
