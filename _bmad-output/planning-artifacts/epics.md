---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments: ["ARCHITECTURE-SPINE.md (Remediación Dominio/Infraestructura — expense-manager-1.0)", "ARCHITECTURE-SPINE.md (Backend Real, Auth y Deployment — expense-manager-1.0, 2026-08-17)"]
---

# expense-manager-1.0 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for expense-manager-1.0, decomposing the requirements from the Architecture Spine into implementable stories. The Architecture Spine focuses on remediating the domain and infrastructure layers of the application using Clean Architecture principles with Next.js App Router.

## Requirements Inventory

### Functional Requirements

**FR1:** Implement unidirectional dependency boundary (presentation → server action → usecase → repository interface → infrastructure)
- All data operations flow through server actions; no client components import infrastructure directly

**FR2:** Ensure repositories are only instantiable from server-only code (app/**/actions.ts)
- Client components use server actions exclusively; repositories never exported to client layer

**FR3:** Create single resolution point (factory pattern) for repository instantiation
- factory.ts is the only module that instantiates repository implementations
- Factory returns promises for async resolution capability: `getTransactionRepository(): Promise<ITransactionRepository>`
- Supports DATA_SOURCE environment variable for mock ↔ real backend switching

**FR4:** Validate input at boundary using Zod schemas
- Each server action validates input with dedicated Zod schema before calling usecase
- Zod errors are coalesced into readable strings; no raw error messages sent to client

**FR5:** Centralize derived state logic in usecases, not components
- Budget status calculations (isNearLimit, isOverBudget, monthly variation) implemented in GetBudgetStatusUseCase
- Components consume pre-calculated results; no recalculation of business metrics

**FR6:** Consolidate shared utilities into src/lib/
- Centralize formatCurrency (eliminate 3 existing copies in components)
- Centralize date formatting utilities
- No competing shared/ folder allowed; all utilities in src/lib/

**FR7:** Generate entity IDs using crypto.randomUUID()
- All repository implementations use crypto.randomUUID() for ID generation
- No Date.now()-based IDs; no id generation in usecases or presentation layer
- ID assignment happens inside repository create() method: `create(Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>)`

**FR8:** Single source of design tokens (app/globals.css)
- app/globals.css is the only source of design tokens
- Delete orphaned presentation/styles/theme.css
- Components use semantic CSS classes, not hardcoded color values or arbitrary utilities

**FR9:** Fix type naming conventions across domain layer
- Rename TransactionRepository → ITransactionRepository (all 4 transaction usecases)
- Ensure all repository interfaces use I-prefix naming
- Verify code compiles with npx tsc --noEmit

**FR10:** Deploy to a free, Node.js-capable host (Vercel) instead of GitHub Pages static export
- Remove `output: "export"` from next.config.ts (already done in prior fix)
- Remove GitHub Pages deploy workflows

**FR11:** Replace Mock*Repository with real persistence via Supabase (Postgres) behind the existing factory pattern
- ApiTransactionRepository, ApiCategoryRepository, ApiBudgetRepository implement the existing I*Repository interfaces
- factory.ts's `DATA_SOURCE='api'` branch resolves to these implementations
- Uses only `@supabase/supabase-js`, no ORM

**FR12:** Add multi-user authentication via Supabase Auth from day one
- Login/session managed via Supabase Auth
- Every transaction/category/budget belongs to an authenticated user

**FR13:** Isolate data per user via Postgres Row Level Security, never via application-level userId filtering
- No `IXRepository` method or `Api*Repository` method takes `userId` as a parameter
- Every table: `ENABLE ROW LEVEL SECURITY` + a policy per operation (SELECT/INSERT/UPDATE/DELETE) with `TO authenticated`
- Policy condition uses `(select auth.uid()) = user_id`, not bare `auth.uid()`

**FR14:** Refresh user session server-side via @supabase/ssr and proxy.ts on every request
- `proxy.ts` at project root (not `middleware.ts` — renamed/deprecated in Next.js 16.2.2)
- `proxy.ts` is also the single place that decides whether a route requires a session

**FR15:** Generate Supabase TypeScript types and keep them in sync with schema migrations
- `supabase gen types typescript` output lives in `src/lib/supabase/database.types.ts`
- Regenerated types are part of the same commit as any migration that changes schema

**FR16:** Version all schema changes via Supabase CLI migrations, each enabling RLS + policies
- `supabase migration new <name>` / `supabase db push`
- Versioned under `supabase/migrations/`
- A migration that creates/changes a table is not complete without RLS + policies (FR13) and regenerated types (FR15)

### Non-Functional Requirements

**NFR1:** Domain layer must have zero framework dependencies
- No Next.js, React, or external framework imports in domain/
- Pure TypeScript entities, interfaces, and business logic

**NFR2:** Type safety: Full TypeScript compilation without errors
- Project must compile with `npx tsc --noEmit` after each story
- No `@ts-ignore` workarounds; issues must be fixed at source

**NFR3:** Consistent naming conventions
- Repository interfaces: PascalCase with I prefix (ITransactionRepository)
- Usecases: PascalCase with UseCase suffix (GetBudgetStatusUseCase, CreateTransactionUseCase)
- Server actions: camelCase with imperative verbs (createTransaction, getBudgetStatus)
- Mock repositories: class name with Mock prefix (MockTransactionRepository)

**NFR4:** Native Date serialization through Server Actions
- Next.js 16 + React 19 serialize Date objects automatically; no manual date conversion needed
- All dates remain as Date objects end-to-end

**NFR5:** Consistent currency formatting
- Use Intl.NumberFormat('es-PE', ...) centrally in src/lib/format.ts
- No hardcoded currency format strings in components

**NFR6:** Error handling pattern
- Server actions return ActionResult<T> = `{ success: true, data: T } | { success: false, error: string }`
- Expected business/validation errors use error field; use throw only for framework conventions (redirect, notFound)
- Repository exceptions mapped to curated messages; no raw e.message exposure

**NFR10:** Never expose or use SUPABASE_SERVICE_ROLE_KEY at runtime
- Only SUPABASE_URL and SUPABASE_ANON_KEY are configured in Vercel
- CI (`lint-and-build` job) fails the build if the literal `SERVICE_ROLE` appears under `src/`

**NFR11:** Operate within Supabase and Vercel free tiers ($0/month, personal project)
- Vercel Hobby plan; relevant quota to watch is Fast Origin Transfer (10GB/month), not Fast Data Transfer
- Supabase free tier (500MB storage, 50K MAU, 2 projects max)

**NFR12:** Accept and document known risk of Supabase free-tier project pausing after 7 days of inactivity
- Restorable for 90 days after pause
- No automated mitigation (e.g. scheduled ping) — accepted manual unpause for personal-scale usage

### Additional Requirements

**AR1:** Enforce server-only boundary with package 'server-only'
- Add `import 'server-only'` at top of every infrastructure/ file
- Accidental import from client code breaks the build, not just code review

**AR2:** Mock repository memoization
- Mock implementations cached as singletons per Node process
- Preserves state across server action calls within same process
- Real API implementations must not assume shared state

**AR3:** Fail-loud configuration
- DATA_SOURCE env var selects mock | api (default: mock)
- Unrecognized DATA_SOURCE value throws error on startup; never falls silently to default

**AR4:** ActionResult pattern for all server actions
- Consistent error handling across all server-side operations
- Enables client-side error UI without try/catch boilerplate

**AR5:** Folder structure adherence
- src/
  - app/ (Next.js App Router)
  - domain/ (entities, repositories, usecases)
  - infrastructure/ (repository implementations, data)
  - lib/ (shared utilities, types)
  - presentation/ (components, hooks)

**AR6:** Fix typo/logic issues in existing code (non-blocking)
- /reports route inexistent but linked in navigation
- "Nueva Categoría" button without handler
- Recharts v3 type issues in Tooltip formatters

**AR7:** Single shared Supabase project across dev/prod/preview
- No separate staging environment (free tier limited to 2 projects; not worth spending one for a single-user personal project)
- Vercel Preview Deployments (automatic per PR) read/write the same real database — accepted risk

**AR8:** Manual backup strategy
- Supabase free tier has no Point-in-Time Recovery or downloadable backups
- Mitigation: manual `supabase db dump` before large schema changes, not automated

**AR9:** `id uuid primary key default gen_random_uuid()` and `user_id uuid not null default (select auth.uid())` at the Postgres column level
- Postgres generates both; `Api*Repository.create()` never sets either by hand
- Domain entities in `domain/entities/` never expose `userId`

### UX Design Requirements

(No UX Design specification document provided; UX requirements are implicit in component behavior described in Architecture Spine)

### FR Coverage Map

| Requirement | Epic | Story | Notes |
|-------------|------|-------|-------|
| FR1 - Unidirectional dependency | Epic 1 | 1.1, 1.2 | Implement server actions + validate architecture |
| FR2 - Server-only repositories | Epic 1 | 1.2, 1.3 | Add server-only package + factory pattern |
| FR3 - Factory pattern | Epic 1 | 1.3 | Create factory.ts with async resolution |
| FR4 - Zod validation | Epic 2 | 2.1, 2.2 | Add Zod to server actions |
| FR5 - Derived state in usecases | Epic 3 | 3.1 | Create GetBudgetStatusUseCase |
| FR6 - Centralized utilities | Epic 1 | 1.4 | Consolidate formatCurrency, delete theme.css |
| FR7 - UUID generation | Epic 1 | 1.3 | Update factory pattern + mock repositories |
| FR8 - Single design token source | Epic 1 | 1.4 | Enforce app/globals.css only |
| FR9 - Type naming fix | Epic 1 | 1.1 | Fix ITransactionRepository naming |
| FR10 - Hosting migration | Epic 4 | (done pre-epic) | Remove static export, deploy to Vercel — PR #5, merged to main before this epic was formalized |
| FR11 - Real persistence | Epic 4 | 4.2, 4.3, 4.4 | Api*Repository via Supabase, one story per entity |
| FR12 - Multi-user auth | Epic 4 | 4.1, 4.5 | Supabase Auth infra (4.1) + login/signup UI (4.5) |
| FR13 - RLS scoping | Epic 4 | 4.1, 4.2, 4.3, 4.4 | RLS policies, no userId params |
| FR14 - Server-side session | Epic 4 | 4.1 | proxy.ts + @supabase/ssr |
| FR15 - Type generation | Epic 4 | 4.2, 4.3, 4.4 | database.types.ts, regenerated per migration |
| FR16 - Schema migrations | Epic 4 | 4.2, 4.3, 4.4 | Supabase CLI, one migration per entity |

## Epic List

### Epic 1: Clean Architecture Foundation
Establish layered dependency boundary and infrastructure scaffolding.
**FRs covered:** FR1, FR2, FR3, FR6, FR7, FR8, FR9

### Epic 2: Input Validation & Type Safety
Add Zod validation and fix TypeScript compilation.
**FRs covered:** FR4

### Epic 3: Domain Logic Centralization
Implement Budget usecase and consolidate business logic.
**FRs covered:** FR5

### Epic 4: Persistent, Private Accounts
Users can create an account, log in, and have their transactions, categories, and budgets persist reliably — private to them, surviving restarts and available from any device — replacing today's shared in-memory demo data that resets on every deploy.
**FRs covered:** FR10, FR11, FR12, FR13, FR14, FR15, FR16 (+ NFR10-12, AR7-9)

---

## Epic 1: Clean Architecture Foundation

Establish the layered architecture with proper dependency flow, infrastructure factory pattern, and shared utility consolidation. This epic closes the gap between current partial Clean Architecture adoption and a complete, enforceable boundary.

### Story 1.1: Fix TransactionRepository Type Naming (Critical Blocker)

**User Story:**
As a developer,
I want type names to follow the I-prefix convention,
So that repository interfaces are consistent and the project compiles without errors.

**Acceptance Criteria:**

**Given** the project has 4 transaction usecases importing `TransactionRepository` (non-existent)
**When** I search the domain layer for the actual repository interface name
**Then** I find it's exported as `ITransactionRepository` from `domain/repositories/transaction.repository.ts:3`
**And** the naming mismatch causes `npx tsc --noEmit` to fail

**Given** the type naming violation exists
**When** I update all 4 usecase files (`create-transaction.ts`, `get-balance.ts`, `get-monthly-stats.ts`, `get-transactions.ts`)
**Then** all imports change from `TransactionRepository` → `ITransactionRepository`
**And** the project compiles without errors: `npx tsc --noEmit` returns exit 0

**Given** the naming convention is now enforced
**When** I inspect all domain/repositories/ files
**Then** every repository interface is prefixed with I: ITransactionRepository, ICategoryRepository, IBudgetRepository (new)
**And** no usecase file imports a non-I-prefixed repository interface

**Dev Notes:**
- This is the blocker that must be fixed before any other story in this epic
- Files to modify:
  - `src/domain/usecases/transactions/create-transaction.ts` (line with import)
  - `src/domain/usecases/transactions/get-balance.ts` (line with import)
  - `src/domain/usecases/transactions/get-monthly-stats.ts` (line with import)
  - `src/domain/usecases/transactions/get-transactions.ts` (line with import)
- Verify with: `npx tsc --noEmit`
- No functional behavior changes; purely a naming fix

---

### Story 1.2: Implement Server-Only Boundary with package 'server-only'

**User Story:**
As an architect,
I want infrastructure code to be inaccessible from client components,
So that accidental imports from 'use client' code fail the build instead of only failing code review.

**Acceptance Criteria:**

**Given** infrastructure/ files can currently be imported from client components
**When** I add `import 'server-only'` at the top of each infrastructure file
**Then** any attempt to import @/infrastructure from a 'use client' component causes build failure

**Given** the server-only guard is in place
**When** a developer tries: `import { MockTransactionRepository } from '@/infrastructure/repositories/mock-transaction.repository'` inside a client component
**Then** the build fails immediately with a clear error message

**Given** server actions in app/**/actions.ts are server-side code
**When** they import from @/infrastructure
**Then** the import succeeds (server-only allows imports from server contexts)

**Dev Notes:**
- Add `import 'server-only'` as first line (after file comment) in:
  - `src/infrastructure/repositories/factory.ts`
  - `src/infrastructure/repositories/mock-transaction.repository.ts`
  - `src/infrastructure/repositories/mock-category.repository.ts`
  - Any future real API repository implementations
  - Any file under `src/infrastructure/`
- Install package if missing: `npm install server-only`
- Verify with a test import attempt: create a client component that tries to import infrastructure, build should fail

---

### Story 1.3: Create Factory Pattern with Async Resolution

**User Story:**
As a developer maintaining the repository layer,
I want a single factory module to instantiate all repositories,
So that switching between mock and real backends requires changing only one place.

**Acceptance Criteria:**

**Given** there is no factory module today
**When** I create `src/infrastructure/repositories/factory.ts`
**Then** it exports two async functions:
  - `getTransactionRepository(): Promise<ITransactionRepository>`
  - `getCategoryRepository(): Promise<ICategoryRepository>`
  - (Placeholder for future: `getBudgetRepository(): Promise<IBudgetRepository>`)

**Given** the factory is created with async signature
**When** a server action calls `const repo = await getTransactionRepository()`
**Then** it receives an instance of MockTransactionRepository (if DATA_SOURCE=mock or unset) or ApiTransactionRepository (if DATA_SOURCE=api, future)

**Given** DATA_SOURCE environment variable is set
**When** DATA_SOURCE='mock': factory returns new MockTransactionRepository (memoized as singleton)
**When** DATA_SOURCE='api': factory returns new ApiTransactionRepository (not memoized, stateless)
**When** DATA_SOURCE is unrecognized (e.g., 'invalid'): factory throws an error on startup with message like "Invalid DATA_SOURCE value: invalid. Expected 'mock' or 'api'."

**Given** mock repositories are singletons
**When** two server actions call getTransactionRepository() in the same Node process
**Then** they receive the same instance (state is shared across calls)
**And** changes made by one action are visible to the next

**Given** real API repositories will be stateless
**When** an ApiTransactionRepository is instantiated
**Then** it does not cache state; each call is independent

**Dev Notes:**
- File: `src/infrastructure/repositories/factory.ts`
- Memoization can be done with a simple module-level variable or weakmap per DATA_SOURCE
- Include jsdoc comments explaining why async signature (future auth/session resolution)
- No server actions yet import factory; this is setup for Story 1.2 continuation
- Environment variable check: `process.env.DATA_SOURCE || 'mock'`
- Include error thrown logic in factory for invalid DATA_SOURCE

---

### Story 1.4: Consolidate Utilities & Remove Duplicate Design System

**User Story:**
As a component developer,
I want to use centralized, deduplicated utilities for currency formatting and design tokens,
So that maintaining formatting logic and design tokens is a single operation.

**Acceptance Criteria:**

**Given** formatCurrency is duplicated in 3 components (dashboard-stats.tsx, monthly-chart.tsx, category-chart.tsx)
**When** I create `src/lib/format.ts` with centralized formatCurrency function
**Then** it exports: `formatCurrency(amount: number, locale: 'es-PE'): string`
**And** all 3 component files import and use this function instead of their local implementations

**Given** there are two competing design token sources (app/globals.css and presentation/styles/theme.css)
**When** I audit all components
**Then** I find components reference tokens from both files (broken design system)

**Given** app/globals.css is the authoritative design system
**When** I delete `src/presentation/styles/theme.css`
**And** I verify all semantic CSS classes are defined in app/globals.css
**Then** no component imports from a deleted file (validation via build)

**Given** all utilities are now centralized
**When** a component needs to format currency, it imports from src/lib/format.ts
**And** when a component needs a design token, it references a semantic class from app/globals.css
**Then** the project has a single source of truth for both

**Dev Notes:**
- Create `src/lib/format.ts`:
  - Export `formatCurrency(amount: number): string` using `Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })`
  - Include jsdoc with examples
- Update 3 component files to import formatCurrency from src/lib/format.ts
- Delete `src/presentation/styles/theme.css` completely
- Verify build succeeds: no remaining imports of deleted file
- Search for any remaining hardcoded color values (bg-emerald-500, bg-[#10b981], etc.) and remove
- Architecture rule AD-8 ensures no future duplication

---

## Epic 2: Input Validation & Type Safety

Add Zod-based input validation at server action boundaries and fix remaining TypeScript compilation issues to ensure data integrity and type safety.

### Story 2.1: Add Zod Validation to Transaction Server Actions

**User Story:**
As a system architect,
I want all server action inputs to be validated with Zod before reaching usecases,
So that invalid data cannot reach the domain layer.

**Acceptance Criteria:**

**Given** server actions exist in app/transactions/actions.ts (or similar)
**When** I define a Zod schema for each action input (e.g., createTransactionSchema, updateTransactionSchema)
**Then** each schema validates: amount (positive number, not NaN), description (non-empty string), category (existing category), date (valid Date)

**Given** a Zod schema is defined
**When** a server action receives input
**Then** it calls `schema.parse(input)` to validate; if validation fails, it catches the error and returns `{ success: false, error: "error message" }`
**And** Zod errors are coalesced into a single readable string: `issues.map(i => i.message).join('; ')`

**Given** validation passes
**When** the server action proceeds to call the usecase
**Then** it passes the validated data directly without re-checking

**Dev Notes:**
- Install Zod: `npm install zod` (version ^4.4.3 per architecture)
- File: `src/app/transactions/actions.ts`
- Define schemas at top of file before action functions
- Pattern: each action has its own schema based on AD-4
- Example schema name: `createTransactionSchema`, `updateTransactionSchema`
- Return type: `ActionResult<TransactionDTO>` from lib/types.ts
- No validation in components; validation happens in server actions only

---

### Story 2.2: Add Zod Validation to Category & Budget Server Actions

**User Story:**
As a system architect,
I want category and budget operations to have the same validation rigor as transactions,
So that data integrity is consistent across all entities.

**Acceptance Criteria:**

**Given** category and budget server actions exist
**When** I define Zod schemas for category/budget operations
**Then** each schema validates entity-specific constraints (e.g., category name unique, budget amount positive)

**Given** validation is implemented for both entities
**When** I run the full test suite (or manual smoke test)
**Then** invalid input is rejected at the server action boundary
**And** valid input reaches usecases without corruption

**Dev Notes:**
- File: `src/app/categories/actions.ts`
- File: `src/app/budgets/actions.ts` (may not exist yet; create if needed)
- Schemas: `createCategorySchema`, `updateCategorySchema`, `createBudgetSchema`, etc.
- Coordinate with Story 3.1 which introduces GetBudgetStatusUseCase

---

## Epic 3: Domain Logic Centralization

Implement GetBudgetStatusUseCase and move all derived state calculations from components into the domain layer.

### Story 3.1: Create GetBudgetStatusUseCase and IBudgetRepository

**User Story:**
As a component developer,
I want budget status (isNearLimit, isOverBudget, percentageUsed) calculated in one place,
So that components receive pre-calculated results instead of doing math inline.

**Acceptance Criteria:**

**Given** there is no GetBudgetStatusUseCase today
**When** I create `src/domain/usecases/budgets/get-budget-status.ts`
**Then** it exports class `GetBudgetStatusUseCase` that:
  - Constructor takes `IBudgetRepository` (injected)
  - Method: `execute(categoryId: string, month: number, year: number): Promise<BudgetStatus>`
  - Calculates: `percentageUsed`, `isNearLimit` (> 80%), `isOverBudget` (> 100%)

**Given** the usecase is created
**When** I create `IBudgetRepository` interface in `src/domain/repositories/budget.repository.ts`
**Then** it exports interface with methods:
  - `getBudgetForCategory(categoryId: string, month: number, year: number): Promise<Budget | null>`
  - `createBudget(data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget>`
  - `updateBudget(id: string, data: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Budget>`

**Given** the interface is defined
**When** I create `MockBudgetRepository` in `src/infrastructure/repositories/mock-budget.repository.ts`
**Then** it implements IBudgetRepository with mock data
**And** the factory's `getBudgetRepository()` function returns a MockBudgetRepository instance

**Given** all pieces are in place
**When** a component calls a server action for budget status
**Then** the action calls `getBudgetStatusUseCase.execute(categoryId, month, year)`
**And** receives pre-calculated `BudgetStatus` object with all computed fields
**And** the component no longer hardcodes budget logic like `category.budget`, `percentageUsed`, etc.

**Dev Notes:**
- Entity: `src/domain/entities/budget.ts` already exists; reuse it
- Budget model should have: id, categoryId, amount, spent, month, year, createdAt, updatedAt
- File structure:
  - `src/domain/repositories/budget.repository.ts` — interface IBudgetRepository
  - `src/domain/usecases/budgets/get-budget-status.ts` — usecase
  - `src/infrastructure/repositories/mock-budget.repository.ts` — mock implementation
  - Update `src/infrastructure/repositories/factory.ts` to include `getBudgetRepository()`
- Coordinate with Story 2.2 for Zod validation of budget operations
- This replaces ad-hoc `category.budget` field with formal Budget entity (AD-5)

---

### Story 3.2: Replace Inline Budget Calculations in Components

**User Story:**
As a component maintainer,
I want to remove all inline budget calculations from components,
So that business logic is in the domain layer, not scattered across presentation.

**Acceptance Criteria:**

**Given** budget calculations exist inline in components (e.g., categories/page.tsx:11-26,52-54)
**When** I search for hardcoded percentages, isOverBudget, isNearLimit logic
**Then** I find duplicate/fragile logic in multiple places

**Given** GetBudgetStatusUseCase now exists (Story 3.1)
**When** I update component server actions to call the usecase
**Then** components receive pre-calculated budget status
**And** no component performs budget math

**Dev Notes:**
- Files to update:
  - `src/app/categories/page.tsx` — remove budget calculation, use server action result
  - `src/presentation/components/dashboard-stats.tsx` — use pre-calculated variation (new usecase or component prop)
  - `src/presentation/components/category-chart.tsx` — similar
- Remove lines like:
  ```javascript
  const percentageUsed = (spent / budget) * 100;
  const isOverBudget = spent > budget;
  const isNearLimit = percentageUsed > 80;
  ```
- Replace with direct consumption of `budgetStatus.percentageUsed`, `budgetStatus.isOverBudget`, etc.
- Verify components no longer do math; server actions do all calculations

---

## Epic 4: Persistent, Private Accounts

Users can create an account, log in, and have their transactions, categories, and budgets persist reliably — private to them, surviving restarts and available from any device — replacing today's shared in-memory demo data that resets on every deploy. Backed by Supabase (Postgres + Auth), hosted on Vercel, with Row Level Security as the only enforcement point for per-user data isolation. Extends `_bmad-output/planning-artifacts/architecture/architecture-expense-manager-1.0-2026-08-17/ARCHITECTURE-SPINE.md` (AD-10 through AD-18).

**FR10 (hosting migration) is already complete** — resolved ahead of story-writing in the same working session: `next.config.ts` no longer sets `output: "export"`, and the GitHub Pages deploy workflows were removed. See commit history on `main` (PR #5, merged before this epic was formalized).

### Story 4.1: Auth Foundation and Server-Side Session

**User Story:**
As a developer,
I want the Supabase project configured with Auth enabled and the app able to establish and refresh an authenticated session server-side,
So that every subsequent story has a real user session to scope data to.

**Acceptance Criteria:**

**Given** the Supabase project exists
**When** `@supabase/supabase-js` (2.112.3) and `@supabase/ssr` (0.12.4) are installed
**Then** `src/lib/supabase/server.ts` exports a `createServerClient` factory using cookies from `next/headers`
**And** `src/lib/supabase/client.ts` exports a `createBrowserClient` factory for any client component that needs auth UI

**Given** a request arrives without a valid session
**When** it passes through `proxy.ts` (project root)
**Then** the auth token is refreshed if a session exists, or the request is redirected to `/login` if the route requires a session
**And** no `middleware.ts` file exists anywhere in the project (Next.js 16.2.2 deprecated and renamed the convention to `proxy.ts`)

**Given** the CI pipeline runs on a PR
**When** the literal string `SERVICE_ROLE` appears anywhere under `src/`
**Then** the `lint-and-build` job fails the build
**And** `SUPABASE_SERVICE_ROLE_KEY` is never defined as a Vercel environment variable for this project

**Dev Notes:**
- Files to create:
  - `src/lib/supabase/server.ts` — `createServerClient` (Server Actions, Server Components)
  - `src/lib/supabase/client.ts` — `createBrowserClient` (browser-side auth UI only)
  - `proxy.ts` — root of project, exports a `proxy` function (not `middleware`) from `next/server`
- CI addition: a grep step in `.github/workflows/ci.yml`'s `lint-and-build` job, e.g. `! grep -r "SERVICE_ROLE" src/`
- Env vars in Vercel: `SUPABASE_URL`, `SUPABASE_ANON_KEY` only
- Reference: ARCHITECTURE-SPINE.md AD-14, AD-15 (2026-08-17 backend spine)
- Verify with: `npx tsc --noEmit`, manual check that an unauthenticated request to a protected route redirects to `/login`

---

### Story 4.2: Persist Transactions via Supabase with RLS

**User Story:**
As a user,
I want my transactions saved to a real, private database instead of in-memory mock data,
So that my data persists across sessions and only I can see it.

**Acceptance Criteria:**

**Given** no `transactions` table exists yet
**When** `supabase migration new create-transactions` is run and applied with `supabase db push`
**Then** the table has `id uuid primary key default gen_random_uuid()`, `user_id uuid not null default (select auth.uid())` with a btree index, and the columns needed by the existing `Transaction` entity
**And** the migration includes `ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;`
**And** a policy exists for each of SELECT/INSERT/UPDATE/DELETE, each `TO authenticated`, each using `(select auth.uid()) = user_id`

**Given** the migration is applied
**When** `supabase gen types typescript` is run
**Then** `src/lib/supabase/database.types.ts` is regenerated and included in the same commit as the migration

**Given** `DATA_SOURCE=api`
**When** a server action calls `getTransactionRepository()`
**Then** it receives an `ApiTransactionRepository` instance implementing `ITransactionRepository` with no signature changes and no `userId` parameter on any method
**And** `ApiTransactionRepository` uses only `@supabase/supabase-js` (no ORM) and never sets `user_id` itself — Postgres' column default handles it

**Dev Notes:**
- Files to create:
  - `supabase/migrations/<timestamp>_create_transactions.sql`
  - `src/infrastructure/repositories/api-transaction.repository.ts`
- Update `src/infrastructure/repositories/factory.ts`: implement the `DATA_SOURCE === 'api'` branch for `getTransactionRepository()`
- Translate `supabase-js`'s `{data, error}` result shape into the inherited exception-based convention (AD-6 heredado / repository exceptions mapped to curated messages, never raw `error.message`)
- Reference: ARCHITECTURE-SPINE.md AD-11, AD-12, AD-13, AD-17, AD-18
- Verify with: `npx tsc --noEmit`, manual test that a second Supabase user cannot see the first user's transactions

---

### Story 4.3: Persist Categories via Supabase with RLS

**User Story:**
As a user,
I want my categories saved to a real, private database instead of in-memory mock data,
So that my custom categories persist and stay private to me.

**Acceptance Criteria:**

**Given** no `categories` table exists yet
**When** `supabase migration new create-categories` is run and applied
**Then** the table follows the same shape as Story 4.2 (`id` default, `user_id` default, RLS enabled, one policy per operation)

**Given** the migration is applied
**When** `supabase gen types typescript` is run
**Then** `database.types.ts` is regenerated in the same commit

**Given** `DATA_SOURCE=api`
**When** a server action calls `getCategoryRepository()`
**Then** it receives an `ApiCategoryRepository` implementing `ICategoryRepository` with no signature changes

**Dev Notes:**
- Files to create:
  - `supabase/migrations/<timestamp>_create_categories.sql`
  - `src/infrastructure/repositories/api-category.repository.ts`
- Update `factory.ts`'s `getCategoryRepository()` `DATA_SOURCE === 'api'` branch
- Same RLS + types + error-mapping pattern as Story 4.2 — do not duplicate the explanation in code comments, just apply it
- Reference: ARCHITECTURE-SPINE.md AD-11, AD-12, AD-13, AD-17, AD-18
- Verify with: `npx tsc --noEmit`

---

### Story 4.4: Persist Budgets via Supabase with RLS

**User Story:**
As a user,
I want my budgets saved to a real, private database instead of in-memory mock data,
So that my budget limits persist and stay private to me.

**Acceptance Criteria:**

**Given** no `budgets` table exists yet
**When** `supabase migration new create-budgets` is run and applied
**Then** the table follows the same shape as Story 4.2 (`id` default, `user_id` default, RLS enabled, one policy per operation)

**Given** the migration is applied
**When** `supabase gen types typescript` is run
**Then** `database.types.ts` is regenerated in the same commit

**Given** `DATA_SOURCE=api`
**When** a server action calls `getBudgetRepository()`
**Then** it receives an `ApiBudgetRepository` implementing `IBudgetRepository` with no signature changes

**Dev Notes:**
- Files to create:
  - `supabase/migrations/<timestamp>_create_budgets.sql`
  - `src/infrastructure/repositories/api-budget.repository.ts`
- Update `factory.ts`'s `getBudgetRepository()` `DATA_SOURCE === 'api'` branch
- Same RLS + types + error-mapping pattern as Story 4.2/4.3
- Reference: ARCHITECTURE-SPINE.md AD-11, AD-12, AD-13, AD-17, AD-18
- Verify with: `npx tsc --noEmit`, and a full manual smoke test with `DATA_SOURCE=api` across transactions, categories, and budgets together

---

### Story 4.5: Minimal Login and Signup UI

**User Story:**
As a user,
I want a simple page to sign up and log in with email and password,
So that I can actually access my persistent, private account.

**Acceptance Criteria:**

**Given** a visitor navigates to `/login`
**When** they submit a valid email and password for an existing account
**Then** Supabase Auth signs them in and they are redirected to the dashboard

**Given** a visitor is on `/login`
**When** they switch to "sign up" and submit a new email and password
**Then** a Supabase Auth account is created and they are signed in, landing on the dashboard

**Given** an authenticated user
**When** they trigger "log out"
**Then** their session ends and they are redirected to `/login`

**Given** an authenticated user is already signed in
**When** they navigate directly to `/login`
**Then** they are redirected to the dashboard instead of seeing the form again

**Dev Notes:**
- Files to create: `src/app/login/page.tsx` (client component), reusing `src/lib/supabase/client.ts` from Story 4.1
- Auth calls (`signInWithPassword`, `signUp`, `signOut`) go directly through the Supabase browser client from the client component — this does **not** violate the inherited server-only boundary (AD-2 heredado), which governs `domain`/`infrastructure` repositories, not Supabase's own Auth SDK. Do not route auth calls through a server action; that would be inventing a pattern the spine doesn't ask for.
- Minimal form styling only — matches AD-8 heredado (semantic classes from `app/globals.css`, no ad-hoc colors)
- Out of scope: password reset, OAuth providers, email verification UI (already named in ARCHITECTURE-SPINE.md Deferred)
- Reference: ARCHITECTURE-SPINE.md AD-14 (proxy.ts redirects here), Deferred section ("UI de login/registro")
- Verify with: manual test of sign up → log out → log in → direct navigation to `/login` while authenticated

---

