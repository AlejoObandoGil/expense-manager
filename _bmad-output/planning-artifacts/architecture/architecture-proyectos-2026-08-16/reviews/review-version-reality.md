# Review: Version & Reality-Check Audit — ARCHITECTURE-SPINE.md

**Verdict:** The Stack table versions and every spot-checked codebase claim are accurate and verifiable against the real files, and zod ^4.4.3 checks out as current and sound via live web search — but the spine's own audit trail has a dead source-file citation and a real `tsc --noEmit` failure in the very `domain/` layer it calls a stable, already-clean foundation to preserve, which it never mentions.

Reviewed: `C:\Users\john\Documents\proyectos\_bmad-output\planning-artifacts\architecture\architecture-proyectos-2026-08-16\ARCHITECTURE-SPINE.md`
Ground truth used: `expense-manager\expense-manager-1.0\package.json`, `expense-manager\expense-manager-1.0\src\**`, `expense-manager\expense-manager-1.0\node_modules\next\dist\docs\**` (the actually-installed Next 16 docs), `npx tsc --noEmit`, live web search (Aug 2026).

---

## CRITICAL

### C1 — Real `tsc --noEmit` failure in `domain/`, the layer the spine calls "ya vigente, preservar," is not mentioned anywhere in the spine

Running `npx tsc --noEmit` from `expense-manager-1.0/` (the exact command the spine's `sources:` frontmatter claims was used for the audit) produces, in addition to the two Recharts `Tooltip formatter` errors the spine *does* cite in Deferred:

- `src/domain/usecases/transactions/create-transaction.ts:1` — imports `TransactionRepository` from `@/domain/repositories`
- `src/domain/usecases/transactions/get-balance.ts:1` — same
- `src/domain/usecases/transactions/get-monthly-stats.ts:1` — same
- `src/domain/usecases/transactions/get-transactions.ts:1` — same

But `src/domain/repositories/transaction.repository.ts:3` only exports `ITransactionRepository` (verified: `src/infrastructure/repositories/index.ts` re-exports nothing named `TransactionRepository` either). TypeScript error: `TS2724: '"@/domain/repositories"' has no exported member named 'TransactionRepository'. Did you mean 'ITransactionRepository'?` — 4 occurrences, plus 6 cascading `TS7006` implicit-`any` errors in `get-balance.ts` and `get-monthly-stats.ts` because the constructor parameter's type resolves to `any`.

Why this matters: the spine's Structural Seed states `domain/ # sin imports de framework (invariante ya vigente, preservar)` (line 118) and the Consistency Conventions table mandates `I`-prefixed repository interfaces (line 90) — this bug is the domain layer's own usecases violating that exact naming convention, and it currently fails to type-check at all. This is not a framework/version question, it's a genuine, currently-reproducible compile break that "reality-checking via tsc --noEmit" (as the spine's own sources line claims was done) should have surfaced. Since AD-1 through AD-8 all build on top of `domain/usecases` being a solid foundation to route Server Actions through, this gap should be either an explicit AD (fix the import name) or at minimum listed in Deferred alongside the Recharts type defect it sits right next to in severity.

**Files:** `src/domain/usecases/transactions/create-transaction.ts:1`, `src/domain/usecases/transactions/get-balance.ts:1`, `src/domain/usecases/transactions/get-monthly-stats.ts:1`, `src/domain/usecases/transactions/get-transactions.ts:1`, `src/domain/repositories/transaction.repository.ts:3`

---

## HIGH

### H1 — Spine's `sources:` frontmatter cites a source path that does not exist

`ARCHITECTURE-SPINE.md:13` cites:

```
C:\Users\john\Documents\proyectos\expense-manager\docs\plan-finanzas-nextjs-e748c3.md
```

That path does not exist. The actual file is at:

```
C:\Users\john\Documents\proyectos\expense-manager\expense-manager-1.0\docs\plan-finanzas-nextjs-e748c3.md
```

(missing the `expense-manager-1.0\` path segment). For a document whose entire premise is "this was reality-checked, not asserted," a broken citation to its own primary planning source is a real defect in the audit trail, even though the content downstream (the AD claims) turned out to be independently verifiable in the actual `src/` files.

**File:** `ARCHITECTURE-SPINE.md:13`

---

## MEDIUM

### M1 — AD-2's server-only boundary relies on convention/code-review discipline; Next.js's own `server-only` package (the standard mechanism for exactly this) is never mentioned

AD-2 (`ARCHITECTURE-SPINE.md:44-48`) states the rule as "Hooks y componentes cliente nunca importan `@/infrastructure/*`" — a discipline-only rule with no compile-time enforcement named. Next.js ships and currently recommends (confirmed via web search, Aug 2026 sources) the `server-only` npm package specifically to make this class of mistake a **build-time error**: a module that imports `server-only` at its top throws a build failure if it's ever transitively pulled into a Client Component bundle, rather than silently working until someone notices at runtime or in review. Given the Structural Seed already designates `infrastructure/repositories/factory.ts` as the single resolution point (AD-3), adding `import 'server-only'` to that file (and/or the mock repository files) would convert AD-2 from a reviewable convention into a mechanically-enforced invariant — which is more in the spirit of "closing the one real crack" that this spine's Design Paradigm section describes as its purpose. Worth at least a note in AD-2 or the Stack table (it ships as a zero-dependency package, `server-only`, separate from the `zod` addition).

**File:** `ARCHITECTURE-SPINE.md:44-48` (AD-2)

### M2 — "Server actions never throw to the client" stated as an absolute, contradicting the pattern shown in this project's own installed Next 16 docs

The Consistency Conventions table (`ARCHITECTURE-SPINE.md:92`) states: "Server actions devuelven `{ success: true, data } | { success: false, error: string }`, nunca `throw` hacia el cliente." The actually-installed Next 16 docs bundled in this project (`node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`, read directly, lines 42-67 and throughout) consistently model authentication/authorization failures inside Server Actions with `throw new Error('Unauthorized')`, and explicitly warn: "Server Functions are reachable via direct POST requests, not just through your application's UI. Always verify authentication and authorization inside every Server Function." A blanket "never throw" rule, if followed literally, would mean auth failures degrade to a `{success:false}` value the caller must remember to check rather than an exception the framework/error boundary can catch by default. This is a defensible product choice for expected validation errors (AD-4's zod failures), but the spine states it without the auth-exception carve-out its own bundled reference docs recommend — worth a qualifying clause rather than an unqualified "nunca."

**File:** `ARCHITECTURE-SPINE.md:92`; ground truth: `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md:30-31,42-67`

---

## LOW

### L1 — Stack table versions: no mismatches found (positive confirmation)

Every version in the Stack table (`ARCHITECTURE-SPINE.md:96-105`) was checked against `expense-manager-1.0/package.json` and matches exactly: `next` 16.2.2, `react`/`react-dom` 19.2.4, `typescript` ^5, `tailwindcss` ^4, `recharts` ^3.8.1, `framer-motion` ^12.38.0, `date-fns` ^4.1.0. No discrepancy to report; noting this explicitly since the review lens asked for it.

### L2 — zod ^4.4.3: confirmed current and sound, but a slightly older zod (4.3.6) is already present transitively

Live web search (Aug 2026) confirms `4.4.3` is zod's current latest stable npm release (next candidate is a `4.5.0-canary` prerelease), and confirms it is a sound, commonly-used, compatible choice for validating input inside Next.js 16 Server Actions alongside React 19 (`useActionState`, form-data parsing patterns). The spine's own annotation "(verificado en zod.dev, ago-2026)" (`ARCHITECTURE-SPINE.md:105`) holds up. Side note for completeness: `zod@4.3.6` already exists in `node_modules/` as a transitive peer dependency of another installed package (per `package-lock.json` ranges like `"zod": "^3.25 || ^4.0"`), so it is not currently a direct project dependency — the spine's "(nuevo, requerido por AD-4)" framing is accurate, this is genuinely a new direct addition, not a version bump.

### L3 — `crypto.randomUUID()` (AD-7) confirmed current; a newer time-sortable variant exists but isn't required

Web search confirms `crypto.randomUUID()` is not deprecated and remains the standard, globally-available Node/Web Crypto API as of 2026. Node has since added `crypto.randomUUIDv7()` (RFC 9562 v7, time-sortable UUIDs) — not necessary for this spine's scope, but worth a footnote since AD-7 explicitly binds "toda implementación, presente y futura" and a future real database-backed repository would likely prefer v7 IDs for index locality.

### L4 — "Server Actions" terminology and file-per-route convention confirmed against this project's actually-installed Next 16 docs

Cross-checked the spine's core pattern (`app/**/actions.ts` with `'use server'`, invoked from client components, per Structural Seed lines 113-114, 117) directly against `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` (the docs bundled with the exact installed Next 16.2.2, not general web knowledge) — the file-level `'use server'` directive and the "Client Components import from a file with `'use server'` at the top" pattern (lines 133-147 of that doc) matches the spine's design exactly. No staleness found.

---

## Spot-checked codebase claims — all confirmed accurate

| Spine claim | Location cited | Verified against |
| --- | --- | --- |
| `presentation` imports `infrastructure` directly for writes | AD-1, `transaction-form.tsx`, `app/transactions/page.tsx` | `src/presentation/components/transactions/transaction-form.tsx:6`, `src/app/transactions/page.tsx:12` — both `import { transactionRepository } from '@/infrastructure/repositories'` confirmed |
| `parseFloat` with no NaN/negative guard | AD-4, `transaction-form.tsx:44` | Confirmed verbatim: `const amount = parseFloat(formData.get('amount') as string);` |
| Budget logic computed inline in a component | AD-5, `categories/page.tsx:11-26,52-54` | Confirmed: `useMemo` block lines 11-26, `percentage`/`isOverBudget`/`isNearLimit` calc lines 52-54, exact match |
| Hardcoded "vs last month" percentages | AD-5, `dashboard-stats.tsx:63,70,77,84` | Confirmed: `trend={{ value: 12.5, ... }}` (63), `8.2` (70), `5.3` (77), `15.8` (84), exact line match |
| `formatCurrency` triplicated | AD-6, `dashboard-stats.tsx`, `monthly-chart.tsx`, `category-chart.tsx` | Confirmed: three independent local `formatCurrency` closures, same `Intl.NumberFormat('es-PE', ...)` body, in all three files |
| `Date.now()` used as entity ID | AD-7, `mock-transaction.repository.ts:33`, `mock-category.repository.ts:23` | Confirmed verbatim: `` id: `tx-${Date.now()}` `` (line 33) and `` id: `cat-${Date.now()}` `` (line 23) |
| `presentation/styles/theme.css` orphaned, no imports | AD-8 | Confirmed: repo-wide grep for `theme.css` / `styles/theme` under `src/` returns zero matches; `app/globals.css` is the only consumed token source |
| `domain/entities/*` have zero framework imports | Structural Seed line 118 | Confirmed: `transaction.ts`, `budget.ts`, `category.ts`, `account.ts` are plain TS interfaces, no imports at all |
| `/reports` linked in nav but route doesn't exist | Deferred | Confirmed: `desktop-sidebar.tsx:12` and `mobile-nav.tsx:12` link `/reports`; no `src/app/reports/` directory exists |
| "Nueva Categoría" button has no handler | Deferred | Confirmed: `categories/page.tsx:43` — `onClick={() => console.log('Nueva categoría')}`, not a real handler |
| Recharts v3 `Tooltip formatter` type defect | Deferred, `category-chart.tsx:87`, `monthly-chart.tsx:87` | Confirmed via `tsc --noEmit`: `TS2322` at both cited lines, exact match |
| `src/lib/` already exists (shadcn), `src/shared/` doesn't | AD-6 | Confirmed: `src/lib/utils.ts` exists and is imported by `presentation/components/shared/*`; no `src/shared/` directory exists |
