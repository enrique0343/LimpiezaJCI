# CLAUDE.md

This file provides guidance to Claude Code (and other AI assistants) when working
with code in this repository.

> **Status: Planning / pre-scaffold.**
> The repository currently holds the **development brief** and an **interactive
> visual prototype** — the source of truth for what gets built — but the
> production application has **not been scaffolded yet**. When you scaffold the
> app, update the "Repository Structure" and "Development Workflow" sections to
> reflect reality, and remove this notice.

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
│   └── GO-PRY-001-2026-spec.md          # Authoritative development brief (es). SOURCE OF TRUTH.
├── prototype/
│   └── limpieza-trazabilidad-jci-v2.html # Single-file vanilla-JS visual + flow prototype.
└── CLAUDE.md                             # This file.
```

The production app (`src/`, `tests/`, etc.) does not exist yet. Once scaffolded,
document its real layout here and keep this tree in sync.

### The prototype (`prototype/limpieza-trazabilidad-jci-v2.html`)

A self-contained HTML file (CSS in `<style>`, app in one `<script>`, no build
step, no framework — plain DOM + a `render()` switch over a `screen` variable).
It is the **exact visual and flow reference**: open it in a browser to see the
intended UI, the Avante design tokens, the screen-by-screen flow, the room state
machine, seed data (users, rooms, protocols, supplies, verification template),
and the append-only audit log in action. When implementing a screen or
component, match the prototype unless the spec says otherwise.

## Development Workflow

> **No build tooling exists yet.** The commands below are the *recommended*
> targets from the spec (§11). Fill in and verify the real commands when the
> project is scaffolded, then update this table.

| Task           | Command (target, fill in when scaffolded) |
| -------------- | ----------------------------------------- |
| Install deps   | `npm install`                             |
| Run dev server | `npm run dev`                             |
| Run tests      | `npm test`                                |
| Lint           | `npm run lint`                            |
| Build          | `npm run build`                           |

To view the prototype today, just open the HTML file in a browser — no server
needed.

**Before committing application code**, run lint and tests and ensure they pass.

## Recommended Stack (from spec §11 — not yet installed)

Confirm with the team (Edwin Martínez) before locking in. The brief recommends:

- **Next.js 15** (App Router) + **strict TypeScript**, shipped as an
  **offline-first PWA** (rooms have inconsistent WiFi; operators must complete
  the full flow offline and sync on reconnect).
- **Tailwind CSS** with the Avante design tokens + **shadcn/ui** (restyled to
  Avante) + **lucide-react** icons.
- **React Hook Form + Zod** for forms/validation; **TanStack Query** for server
  state; **next-pwa / Serwist** for the service worker.
- **PostgreSQL 16+** via **Prisma**; **NextAuth.js** (Credentials, PIN hashed
  with argon2). tRPC optional for end-to-end typing.
- QR: `html5-qrcode`/`@zxing/browser` (scan) + `qrcode` (generation);
  `sharp` for photo processing; S3/R2/MinIO for photo storage.
- Self-hosted on Avante infrastructure; Docker + docker-compose.

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
- **Design tokens:** use the CSS variables defined in the prototype's `:root`
  (neutrals dominate the chrome; institutional accents `--azul-marino`,
  `--turquesa`, `--violeta` for data/hierarchy only).
- **Functional traffic-light colors** (`--verde`/`--ambar`/`--rojo`/`--rojo2`)
  are allowed **only** on interactive state buttons (Conforme/No conforme),
  finding severities, and room-state chips — a deliberate, documented *poka-yoke*
  exception. Do not use them on institutional documents bound for the Board, JCI,
  or regulators.
- No gradients, heavy shadows, 3D effects, or colored card top-borders. Lucide
  thin-line monochrome icons only. Border radius ≤ 4px. No emojis in chrome.
- **Mobile-first:** usable one-handed and with gloves; tap targets ≥ 44px;
  correct at 360×640 up to 480px wide.
- Reusable components to build (spec §10.4): `Button`, `Card`, `StatePill`,
  `Badge`, `StepBlock`, `PhotoSlot`, `Stepper`, `Timer`, `Modal`, `Toast` — match
  the prototype's rendering exactly.

## Acceptance Criteria & Seed Data

The v1 acceptance criteria are in spec §14 (full terminal-cleaning flow offline,
enforced role separation, ≥15 audit events per cycle, QR rejection of invalid
codes, PCI-only release for high-risk rooms, PDF audit export, installable PWA,
≥80% domain test coverage, Lighthouse PWA ≥90). Seed data for demos is in §15.
Scope boundaries (in/out of v1, v2 roadmap) are in §13.

## Git & Branching Conventions

- **Default branch:** `main`. (Note: as of writing, no `main` exists on the
  remote yet — the first commit there will create it.)
- **Feature branches:** `feature/<short-desc>`, `fix/<short-desc>`, or
  `claude/<short-desc>` for AI-assisted work.
- **Commits:** clear, imperative mood (e.g. "Add execution timer").
- **Pull requests:** open a draft PR for review rather than pushing to `main`.

## Conventions for AI Assistants

- **The spec (`docs/GO-PRY-001-2026-spec.md`) governs.** When in doubt, read it.
  The prototype governs visual/flow detail. Don't contradict either silently.
- **Don't weaken the §9 business rules** to make something easier — they are the
  whole point of the system. If a rule blocks you, surface it; don't bypass it.
- **Don't invent files, frameworks, or commands** that don't exist yet. The app
  is unscaffolded; verify the current state before referencing it.
- When you scaffold the app or add tooling, **update this file in the same
  change** so it always reflects reality.
- Prefer conventions already present in the prototype and spec over introducing
  new ones. Keep this file concise and current.

## Next Steps

Before coding (spec §18 lists formal preconditions — PCI co-leadership, audited
base PNTs, budget/stack sign-off, updated internal regulation). Once cleared:

1. Confirm the stack with Edwin Martínez and scaffold the Next.js 15 + TS PWA.
2. Add a `README.md` for human contributors and a dependency manifest.
3. Model the domain (§7) in Prisma, enforcing the §9 rules at the DB/ORM layer.
4. Implement the flow screen-by-screen against the prototype, then fill in the
   "Repository Structure" and "Development Workflow" sections above.
