<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- bmad:context -->
<!-- Verified 2026-08-17 against 857121e. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## expense-manager-1.0

Personal finance tracker. Next.js App Router + React, Clean Architecture (domain/infrastructure/presentation) with Server Actions as the only data-access path. Planning and architecture docs live in `_bmad-output/planning-artifacts/`.

## Running and verifying

- Run `npm run build`, not just `npx tsc --noEmit` and lint, before merging infra changes — it catches errors the other two miss (e.g. Server Actions vs `output: "export"` conflicts).

## Known pitfalls

- Read the whole `.gitignore` before editing a section — a partial edit once dropped the `_bmad/`, `.claude/`, `.agents/`, `.opencode/` lines and let `git add -A` commit 2747 local tooling files into `develop`.
- `next.config.ts` must not set `output: "export"` — the app's Server Actions (`'use server'` in `app/**/actions.ts`) are incompatible with static export; this broke the production build across two merged PRs before anyone ran a full build to catch it. See ARCHITECTURE-SPINE.md AD-9.
- Don't assume an existing `develop` branch is current — diff against `main` first (`git log main..develop`) before treating it as the Git Flow integration branch; a stale local `develop` here was 19 commits behind.

<!-- /bmad:context -->
