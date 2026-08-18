---
name: 'Adversarial Divergence Review — ARCHITECTURE-SPINE.md'
type: review
reviews: '../ARCHITECTURE-SPINE.md'
created: '2026-08-16'
---

# Adversarial Divergence Review — Remediación Dominio/Infraestructura (expense-manager-1.0)

## Verdict

The spine correctly closes the one gap it names (write-path bypassing usecases) but leaves at least three load-bearing wiring decisions — where repository instantiation actually happens, what shape the factory functions have, and who owns the Budget concept — genuinely undecided, so two engineers who each follow every AD to the letter can still produce incompatible codebases, including a direct textual contradiction between AD-2's prose and the mermaid diagram/AD-3.

---

## CRITICAL

### C1 — AD-2's prose contradicts AD-3 and the mermaid diagram on *where* repositories are instantiated

- **Two compliant implementations:**
  - **Engineer A (literal AD-2 reading):** AD-2's Rule says "los repositorios se instancian únicamente dentro de Server Actions (`src/app/**/actions.ts`)." Taken literally, A writes `const repo = process.env.DATA_SOURCE === 'api' ? new ApiTransactionRepository() : new MockTransactionRepository()` inline, at the top of every `actions.ts` file that needs a repository. `factory.ts` is never called — A never even opens it, and nothing in AD-2's rule text requires it.
  - **Engineer B (literal AD-3 + diagram reading):** AD-3 says `factory.ts` "es el único lugar permitido para ese switch," and the mermaid diagram draws `F["factory.ts"] --> M["Mock*Repository"]` / `F --> R["(futuro) Api*Repository"]` — i.e. the diagram shows the factory doing the `new`-ing, not `actions.ts`. B puts the `DATA_SOURCE` switch and both `new Mock...()`/`new Api...()` calls inside `factory.ts`, and every `actions.ts` just calls `getTransactionRepository()`.
- **Divergence:** A duplicates the `DATA_SOURCE` switch into every `actions.ts` file (defeating AD-3's entire purpose — the future backend swap now touches N files, not one) while remaining literally AD-2-compliant. B centralizes it in `factory.ts` and never has a raw `new Mock...Repository()` anywhere under `app/**/actions.ts`, which is arguably a *violation* of AD-2's literal text ("repositories are instantiated only inside Server Actions") even though it's what the diagram and AD-3 clearly intend. A code reviewer citing AD-2's prose could legitimately block B's (correct) implementation.
- **Fix:** Reword AD-2's Rule to distinguish *instantiation* (happens in `factory.ts`, per AD-3) from *invocation reachability* (the factory is only ever called from server-only code). E.g.: "Repository instances are constructed exclusively inside `infrastructure/repositories/factory.ts`. That factory is imported and invoked only from `src/app/**/actions.ts`; no other file — client or server — calls `new` on a repository class." Also add an edge `A -->|resuelve vía| F` to the mermaid diagram; currently `factory.ts` is drawn floating, disconnected from the invocation chain (`P -> A -> U`), which is precisely why A1's misreading is defensible.

### C2 — Factory function signature (sync/async, singleton/per-call) is unspecified, and both defaults break something

- **Two compliant implementations:**
  - **Engineer A (maintains the mock today):** writes `function getTransactionRepository(): ITransactionRepository { return DATA_SOURCE === 'api' ? new ApiTransactionRepository() : new MockTransactionRepository() }` — synchronous, and every `actions.ts` call site does `const repo = getTransactionRepository()` (no `await`).
  - **Engineer B (builds the real backend later, per the Deferred backend spine):** the real `ApiTransactionRepository` needs to read the current user's session/auth token via Next's `cookies()`/`headers()` (async APIs in Next 16) before it can be constructed, or needs an async connection-pool handshake. B is forced to change the factory to `async function getTransactionRepository(): Promise<ITransactionRepository>`.
- **Divergence:** B's change is a breaking signature change that ripples into every `actions.ts` call site A ever wrote (`const repo = getTransactionRepository()` → `const repo = await getTransactionRepository()`), across `transactions/actions.ts`, `categories/actions.ts`, and any future feature's actions file. This is exactly the "swap mock↔real touches every consumer" failure AD-3 exists to prevent, and it happens specifically at the mock-engineer/future-backend-engineer seam the review brief calls out. Separately: neither engineer is told whether the factory caches a singleton per `DATA_SOURCE` value or constructs fresh on every call. If B (or A, independently, for symmetry with a "pure factory function" mental model) makes it construct fresh every call, in-memory `Mock*Repository` state resets between server-action invocations within the same process — silently breaking "create a transaction, then list transactions" in the mock, since there is no persistence layer to fall back on.
- **Fix:** Make AD-3's Rule state the factory signature explicitly: `async function getTransactionRepository(): Promise<ITransactionRepository>` / same for category (async from day one, even though the mock doesn't need it, precisely so the future swap is signature-stable), and mandate that each factory function returns a module-scoped singleton per resolved `DATA_SOURCE` value (constructed once, memoized), not a fresh instance per call.

### C3 — No single owner for "Budget" is decided; AD-5's own new usecase can legally be built two incompatible ways

- **Two compliant implementations:**
  - **Engineer A:** reads the Deferred section — only `Account` is explicitly named as a dormant, out-of-scope entity — and infers `Budget` is in scope as-is. A activates the existing (currently unreferenced) `domain/entities/budget.ts` (`id, categoryId, amount, month, year, spent, remaining, percentageUsed`), adds `IBudgetRepository` + `mock-budget.repository.ts`, wires it into `factory.ts` as `getBudgetRepository()`, and has `GetBudgetStatusUseCase` depend on it.
  - **Engineer B:** notes AD-5's Prevents clause cites the *actual* current bug — `categories/page.tsx` computing `isNearLimit`/`isOverBudget` from a plain `Category.budget` number field — and treats "move this into a usecase" as the literal scope. B builds `GetBudgetStatusUseCase(categoryRepo: ICategoryRepository, transactionRepo: ITransactionRepository)` that derives status purely from `Category.budget` + summed transactions, and never touches `domain/entities/budget.ts` or adds a repository for it.
- **Divergence:** Two different domain models for the same feature — one keyed by a first-class `Budget` entity/repository, one keyed off `Category.budget` — with different `GetBudgetStatusUseCase` constructor signatures, different return shapes, and a different `factory.ts` surface (2 vs 3 exposed functions). Both satisfy AD-5's Rule text and AD-3's Rule text individually. This is exactly the "two different owners of one entity" failure mode the review brief asked to hunt for, and it sits on the spine's own headline new unit (`GetBudgetStatusUseCase`), not on a peripheral one.
- **Fix:** Either (a) add an explicit AD/Deferred entry stating `Budget` (the entity) is out of scope for this remediation like `Account` is, and `GetBudgetStatusUseCase` computes status from `Category.budget` + transactions only — no new repository; or (b) if the entity is meant to be activated, say so explicitly in AD-5 and add `IBudgetRepository`/`getBudgetRepository()` to AD-3 and the Structural Seed. Currently the spine implies (b) by putting `GetBudgetStatusUseCase` under `domain/usecases/budgets/` (plural, entity-shaped) while the Prevents-clause evidence supports (a).

---

## HIGH

### H1 — AD-7 doesn't say which layer assigns the UUID, so the repository interface's own signature is unsettled

- **Two compliant implementations:**
  - **Engineer A:** `CreateTransactionUseCase` builds the full entity including `id: crypto.randomUUID()` before calling `repository.create(transaction: Transaction)`. `ITransactionRepository.create()` takes a complete `Transaction`.
  - **Engineer B (future real-backend implementer):** assumes the server (DB auto-generated UUID column, or the API endpoint) assigns the id, so `ApiTransactionRepository.create()` takes `Omit<Transaction, 'id'>` and returns the server-assigned entity; to stay consistent, B also changes `MockTransactionRepository.create()` to generate the id internally via `crypto.randomUUID()` inside the repository, matching AD-7's Binds ("infrastructure/repositories... toda implementación").
- **Divergence:** `ITransactionRepository.create()`'s parameter type itself differs (`Transaction` vs `Omit<Transaction,'id'>`) depending on who assigns the id — this is a domain interface break, not a cosmetic one, and it's precisely the mock-vs-future-real-backend seam the review brief calls out. AD-7's Binds line ("toda implementación... presente y futura" generates ids via `crypto.randomUUID()`) reads as infra-owns-id-generation, but its Rule sentence only forbids `Date.now()`, it never states which layer calls `crypto.randomUUID()`.
- **Fix:** State explicitly in AD-7 (or AD-1/interface convention row) that `create()` methods on repository interfaces accept an id-less payload and the concrete repository implementation is responsible for generating and returning the id — locking the interface shape so mock and future-real implementations agree.

### H2 — The `error: string` contract is underspecified for both validation and runtime failures

- **Two compliant implementations:**
  - **Validation side:** Engineer A collapses all zod issues into `error.issues.map(i => i.message).join('; ')`. Engineer B returns only `error.issues[0].message`. Engineer C serializes a field→message map as JSON inside the string (`error: JSON.stringify({amount: 'must be positive'})`) so the client can highlight the offending form field. All three satisfy "`{ success: false, error: string }`."
  - **Runtime side:** Engineer A wraps every usecase call in a generic `try { ... } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Unknown error' } }`, leaking whatever internal message the mock repository happens to throw. Engineer B defines typed domain errors (`TransactionNotFoundError`, etc.) and maps them to curated user-facing strings in `actions.ts`.
- **Divergence:** Any client-side code that tries to do field-level error display (a very likely finance-form need — "highlight the amount field") only works against one of the three validation-error encodings, and will silently mis-render or break against the others. A component built against Engineer A's `transactions/actions.ts` error strings and reused (or copy-pasted as a pattern) against Engineer C's `categories/actions.ts` will fail to parse the JSON-in-string convention it doesn't expect.
- **Fix:** Extend the Consistency Conventions "State & cross-cutting" row to pin down the error string's *internal* contract, not just its outer type — e.g. "always a single human-readable sentence, never structured/parseable data; field-level validation errors are out of scope for this remediation" (or the opposite, with a defined structured shape). Also state whether repository/runtime exceptions must be caught and mapped through a whitelist of user-safe messages, or may pass through `e.message` directly.

---

## MEDIUM

### M1 — No AD governs the split between `app/*/page.tsx` and `presentation/components/`

- **Two compliant implementations:** Engineer A (transactions) puts nearly all markup/state directly in `app/transactions/page.tsx`, treating `presentation/components/` as a leaf library (buttons, cards) only. Engineer B (categories) keeps `app/categories/page.tsx` as a thin shell and pushes the whole feature UI into `presentation/components/categories/CategoryPage.tsx`.
- **Divergence:** Both pass AD-1 and AD-2 (neither imports `@/infrastructure/*` from client code), yet the codebase ends up with two incompatible conventions for "where a feature lives," which will confuse anyone maintaining both directories and makes `presentation/` an inconsistent unit of reuse.
- **Fix:** Add a line to the Structural Seed or Consistency Conventions naming the division of responsibility, e.g. "`app/**/page.tsx` is a thin composition shell; all feature markup/state lives under `presentation/components/<feature>/`."

### M2 — AD-3's factory function set is illustrative, not closed

- **Two compliant implementations:** Engineer A treats `getTransactionRepository()`/`getCategoryRepository()` as the complete, closed API surface. Engineer B, needing a third repository (see C3), adds `getBudgetRepository()` to `factory.ts` without violating any AD text, since AD-3 only says the factory "expone" (exposes) those two as an example, not that it exposes *only* those two.
- **Divergence:** `factory.ts`'s public surface silently grows differently depending on which engineer touches it first, with no review criterion to say "adding a new exported function here is/isn't in scope for this remediation."
- **Fix:** Make AD-3 state the closed set of factory functions this remediation covers (tie it to C3's resolution), or explicitly say new entity repositories may be added to the factory following the same pattern.

### M3 — AD-8's "no raw palette utility" prohibition has an arbitrary-value loophole and no token-naming/governance rule

- **Two compliant implementations:** Engineer A, needing a "danger" color with no existing semantic token, adds `--color-danger` to `app/globals.css` (fully compliant). Engineer B, under time pressure, uses `bg-[#ef4444]` (a Tailwind arbitrary-value utility) — this is not literally `bg-emerald-500` (a *named* palette utility), so it arguably doesn't match AD-8's Prevents-clause example, even though it's exactly the hardcoded-color problem AD-8 exists to stop.
- **Divergence:** Two different-looking "danger" reds ship in the same app, one token-driven and themeable, one not — and a strict reviewer citing AD-8's literal wording ("no utilidades de paleta cruda... `bg-emerald-500`, etc.") can't cleanly reject the arbitrary-value version. Separately, nothing says how two engineers who each independently need a new semantic token (e.g. both need "danger") should converge on one token name instead of two (`--color-danger` vs `--danger-fg`).
- **Fix:** Broaden AD-8's Rule to explicitly ban Tailwind arbitrary-value color utilities (`bg-[...]`, `text-[...]`, `border-[...]`) alongside named palette utilities, and add a token-naming convention (or a "propose new tokens via X" note) to the Consistency Conventions table.

### M4 — `infrastructure/data/` appears in the Structural Seed with no defined purpose

- **Two compliant implementations:** Engineer A uses `infrastructure/data/` for static seed/fixture arrays consumed by the mock repositories (`seed-transactions.ts`). Engineer B uses it for wire-format ↔ domain-entity mapper functions for the future API repository (DTOs).
- **Divergence:** No AD binds or defines this folder, so its contents/purpose are whatever the first engineer to touch it decides, and a second engineer building something unrelated may reuse the name for a third, incompatible purpose.
- **Fix:** Either remove the folder from the Structural Seed until its purpose is decided, or add one line describing what belongs there.

### M5 — Mermaid diagram omits `src/lib` entirely despite AD-6 naming it authoritative

- **Finding (not a two-engineer pair, but a diagram/prose consistency defect the review brief asked to check explicitly):** The diagram shows only `presentation → app/actions.ts → domain/usecases → domain/repositories(interfaces)` plus the `factory.ts → Mock/Api` cluster. `lib/` never appears, so the diagram gives no signal on whether `domain/usecases` may import `src/lib/format.ts` (e.g., to format a derived money value before returning it from a usecase) or whether formatting must stay entirely in `presentation`. This directly affects whether two usecases can disagree on returning raw numbers vs. pre-formatted currency strings for conceptually the same "money" field — a real shape inconsistency across usecases with nothing in the diagram or AD-6 to arbitrate it.
- **Fix:** Add `lib/` to the diagram (likely as a dependency available to all layers, drawn with a dashed "utility, no direction constraint" style), and add one sentence to AD-6 or AD-5 stating that usecases return raw domain values (numbers/Dates) and formatting is a presentation-only concern.

---

## LOW

### L1 — No declared home for the shared `ActionResult<T>` envelope type

The Consistency Conventions table specifies the shape `{ success: true, data } | { success: false, error: string }` but never says where the TypeScript type for it lives. Engineer A puts it in a new `src/lib/types.ts` (technically "src/lib/" per AD-6, though AD-6's binds text only mentions "formato de moneda, fechas" as examples, not shared types). Engineer B inlines a locally-defined type per `actions.ts` file. Structurally identical types are TS-compatible so this may not break compilation, but if a field name ever drifts (`data` vs `result`) between independently-inlined copies, callers silently mismatch. Suggest naming a canonical location (e.g. `src/lib/action-result.ts`) in AD-6 or the Structural Seed.

### L2 — Zero-argument server actions: is a zod schema still mandatory?

AD-4's Rule says "cada server action valida su input con un schema zod... antes de invocar el usecase." For a no-arg action like `getCategories()`, Engineer A adds boilerplate `z.void().parse(undefined)` for uniformity; Engineer B skips validation since there's no input to validate. Low risk since there's little to actually diverge on, but worth one clarifying clause ("actions with no input parameters are exempt").

### L3 — Domain layer's allowed third-party dependencies are unstated

`domain/` is described as having "sin dependencias de framework" (preserve). `date-fns` is in the Stack table and is a natural fit for usecase-level date math (e.g. "start of month" for `GetMonthlyStatsUseCase`), and `zod` is explicitly scoped to `app/**/actions.ts` only by AD-4's Binds line. Nothing says whether `date-fns` (or any other pure-utility npm package) may be imported inside `domain/usecases`, so one engineer may treat "framework-free" as "no React/Next only" (date-fns OK) while another treats it as "domain imports nothing outside domain/" (date-fns forbidden, hand-rolled date math instead) — a portability/consistency difference for any future non-Next domain reuse. Worth one clarifying sentence.

### L4 — Invalid `DATA_SOURCE` value: silent fallback vs hard failure is unspecified

AD-3 says `DATA_SOURCE` is `mock | api`, default `mock`. It doesn't say what the factory does if the env var is set to an unrecognized string (typo, e.g. `DATA_SOURCE=Api`). Engineer A treats anything other than the literal string `'api'` as mock (silent fallback — a typo silently keeps the app on mock data in what was meant to be a real-backend deploy). Engineer B throws at factory-call time on an unrecognized value (fail loud). Both comply with AD-3's letter; the failure modes are operationally very different. Suggest one sentence pinning down fail-loud behavior, since this is exactly the kind of thing that's invisible until a production deploy silently runs on mock data.

---

## Answering the brief's specific checks

- **Mermaid diagram vs AD prose:** Inconsistent in two ways — (1) AD-2's prose ("repos instantiated only inside Server Actions") contradicts the diagram's `factory.ts → Mock/Api` edges, which show the factory as the instantiation site (C1); (2) the diagram never draws an edge from `app/**/actions.ts` to `factory.ts`, so the actual invocation path AD-2/AD-3 depend on is not shown, and `src/lib` is missing from the diagram entirely despite AD-6 governing it (M5).
- **Structural Seed vs ADs:** Two soft contradictions — `infrastructure/data/` has no AD-assigned purpose (M4), and `domain/usecases/budgets/GetBudgetStatusUseCase` is seeded without a corresponding `domain/repositories/IBudgetRepository`, silently pre-judging the C3 ownership question toward "use `Category.budget`, not a first-class `Budget` entity" — but nothing states that decision out loud.
- **Deferred section — anything that should have been an AD:** Yes — `Budget` entity activation (C3) is the clearest case. `Account` is explicitly named as deferred/dormant; `Budget` is equally dormant today (memlog: "never referenced by any repository/usecase/component") but is *not* deferred — instead AD-5 quietly assumes it's in scope for `GetBudgetStatusUseCase` without saying whether the entity itself is activated. This asymmetry (deferring one dormant entity but not the other, without a decision) is the single highest-value gap to close before implementation starts.

Full path reviewed: `C:\Users\john\Documents\proyectos\_bmad-output\planning-artifacts\architecture\architecture-proyectos-2026-08-16\ARCHITECTURE-SPINE.md`
