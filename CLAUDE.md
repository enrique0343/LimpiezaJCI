# CLAUDE.md

This file provides guidance to Claude Code (and other AI assistants) when working
with code in this repository.

> **Status: Empty repository (scaffold).**
> As of the last update, this repository contains no application code — only this
> file. The sections below are a template describing the intended conventions.
> **When real code is added, update each section to reflect the actual state** and
> remove this notice.

## Project Overview

**LimpiezaJCI** — *(working title; `limpieza` is Spanish for "cleaning").* The
project does not yet have committed source code. Likely a cleaning-service
application (web, mobile, or API), but the stack has not been chosen.

When you establish the project, fill in:

- **What it does:** one or two sentences on the product/purpose.
- **Who it's for:** end users, internal staff, both.
- **Languages / frameworks:** the chosen stack.

## Repository Structure

There is currently no code. Once the project is scaffolded, document the layout
here, for example:

```
.
├── src/            # Application source
├── tests/          # Test suites
├── public/         # Static assets (web projects)
├── docs/           # Documentation
└── CLAUDE.md       # This file
```

Keep this tree in sync with reality. List only the directories that matter for
navigation and explain the purpose of each.

## Development Workflow

Document the real commands once tooling exists. Typical placeholders:

| Task            | Command (fill in)        |
| --------------- | ------------------------ |
| Install deps    | `<e.g. npm install>`     |
| Run dev server  | `<e.g. npm run dev>`     |
| Run tests       | `<e.g. npm test>`        |
| Lint            | `<e.g. npm run lint>`    |
| Build           | `<e.g. npm run build>`   |

**Before committing**, run the lint and test commands and ensure they pass.

## Git & Branching Conventions

- **Default branch:** `main` (no commits exist yet — the first push will create it).
- **Feature branches:** use descriptive names, e.g. `feature/<short-desc>`,
  `fix/<short-desc>`, or `claude/<short-desc>` for AI-assisted work.
- **Commits:** write clear, imperative-mood messages (e.g. "Add booking form").
- **Pull requests:** open a PR for review rather than pushing directly to `main`.

## Conventions for AI Assistants

- This repo is empty; **do not invent files, frameworks, or commands** that don't
  exist. Verify the current state before documenting or referencing it.
- When you scaffold the project, **update this file in the same change** so it
  always reflects the real codebase.
- Prefer the conventions already present in the code over introducing new ones.
- Match existing formatting, naming, and structure when adding code.
- Keep this file concise and current — stale guidance is worse than none.

## Next Steps to Make This Repo Useful

1. Decide the stack (web / mobile / API) and scaffold the project.
2. Add a `README.md` for human contributors.
3. Commit a dependency manifest (e.g. `package.json`, `requirements.txt`).
4. Replace the placeholder sections above with concrete details.
