# Epic 5 Context: Cuentas Bancarias (Accounts)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Give users first-class bank/cash accounts (credit card, checking, savings, cash, investment) so every transaction has a source/destination, balances are visible per account, and over-indebtedness on credit cards is detectable. This closes a gap in the MVP where transactions carried no account context.

## Stories

- Story 5.1: Create Account table + RLS + migrations — **done**
- Story 5.2: Add account_id to transactions — backlog
- Story 5.3: Implement Account CRUD (server actions) — **done**
- Story 5.4: Account selector in Transaction form — backlog
- Story 5.5: Dashboard — Balance per Account — backlog (spec exists: `spec-5-5-dashboard-balance-por-cuenta.md`)
- Story 5.6: Accounts Management Page (`/accounts`) — backlog, next up

## Requirements & Constraints

- A user can create multiple accounts; each has a type (credit_card, checking, savings, cash, investment), name, currency, and active status.
- Every transaction must be linked to an account (once 5.2 lands); deleting/deactivating an account must never break historical transactions.
- RLS must prevent any user from seeing another user's accounts — this is enforced in Postgres, never in application code.
- Dashboard must show balance per account, flag credit-card accounts as over-limit (negative balance) in red, and show a total across all accounts.
- Account balance updates automatically as transactions are recorded — it is not a value a user or UI ever sets directly.

## Technical Decisions

- Follows the same Clean Architecture layering as the rest of the app: presentation → `app/**/actions.ts` (Server Actions, `'use server'`) → domain usecases → repository interface → infrastructure. Repositories are only reachable from server-only code; no client component imports infrastructure directly.
- Naming conventions: repository interfaces are `I`-prefixed (`IAccountRepository`, already in `src/domain/repositories/account.repository.ts`); usecases are `PascalCase` + `UseCase` suffix; server actions are `camelCase` imperative verbs (`createAccount`, `getAccounts`); mock repos use a `Mock` prefix, real ones an `Api` prefix — `MockAccountRepository`/`ApiAccountRepository` already exist, resolved via `infrastructure/repositories/factory.ts`'s `DATA_SOURCE` switch (`mock`/`api`).
- Every server action validates input with a Zod schema before calling the repository/usecase; Zod errors are coalesced into a single readable string (`issues.map(i => i.message).join('; ')`). Returns follow `ActionResult<T> = { success: true, data: T } | { success: false, error: string }`; no raw `error.message` leaks to the client except via this wrapping.
- Postgres owns `id` (`gen_random_uuid()`) and `user_id` (`default auth.uid()`, FK to `auth.users` with `on delete cascade`); domain entities never expose `userId`. RLS is enabled with one policy per operation (SELECT/INSERT/UPDATE/DELETE), each `TO authenticated`, each using `(select auth.uid()) = user_id` (subselect form, not bare `auth.uid()`).
- Every new signup gets a seeded default "Efectivo" (cash) account via an `auth.users` insert trigger (`handle_new_user_accounts`), matching the pattern already used for default categories.
- **Balance is never stored** — `accounts.initial_balance` is the only balance column. Current/derived balance = `initial_balance + Σ(income) − Σ(expense)` of the account's transactions, computed on read (mirrors how budget `remaining`/`percentageUsed` are derived rather than stored in `ApiBudgetRepository`). Story 5.5/5.6 work needs a usecase or repository method to compute this — none exists yet (`GetAccountsWithBalanceUseCase` referenced in migration comments is aspirational, not yet implemented).
- Account deletion is a **business-logic branch already implemented** in `src/app/accounts/actions.ts::deleteAccount`: if the account has any associated transactions (`transactionRepository.findByAccount(id)` returns non-empty), it soft-deletes (`isActive: false`) instead of hard-deleting. Only an account with zero transactions is hard-deleted. `transactions.account_id` will carry `ON DELETE RESTRICT` (per Story 5.2) as a defensive backstop that normal usage should never trigger, since soft-delete is meant to catch that case first.
- `IAccountRepository` (existing) exposes: `findAll`, `findById`, `findActive`, `create`, `update`, `delete`. `ITransactionRepository` already has `findByAccount(accountId)`, used by the delete-account soft-delete check.
- `Account` entity fields (existing, `src/domain/entities/account.ts`): `id`, `name`, `type` (`'credit_card' | 'checking' | 'savings' | 'cash' | 'investment'`), `initialBalance`, `currency`, `isActive`.
- Deployment/runtime constraints inherited from the rest of the app apply unchanged: Vercel Hobby host, Supabase free tier (project can pause after 7 days idle), no ORM (`@supabase/supabase-js` only), `SUPABASE_SERVICE_ROLE_KEY` never used at runtime.

## Cross-Story Dependencies

- 5.4 (account selector in transaction form), 5.5 (dashboard balance), and 5.6 (accounts management page) all depend on 5.2 (`account_id` on transactions) for full correctness, though 5.6's basic CRUD UI can be built against the already-done 5.1/5.3 infrastructure alone.
- 5.5 and 5.6 both need a way to compute derived current balance per account (see "balance is never stored" above) — this derivation doesn't exist yet and whichever story implements it first should expose it as a reusable usecase/repository method rather than duplicating the calculation.
- 5.6 (Accounts Management Page) is the next story planned for build; it can reuse `getAccounts`/`getActiveAccounts`/`createAccount`/`updateAccount`/`deleteAccount` from `src/app/accounts/actions.ts` as-is — no new server actions are needed for basic list/create/edit/soft-delete.
