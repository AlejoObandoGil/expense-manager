# Story 5.1: Dashboard Balance por Cuenta

**User Story:**
As a user,
I want to see the balance of each account displayed on the dashboard,
So that I can track my financial position across all my accounts at a glance.

**Acceptance Criteria:**

**Given** the user is authenticated and on the dashboard page
**When** the dashboard loads
**Then** a new section displays cards for each account with their current balance
**And** each card shows: account name, account type icon, current balance, and currency
**And** credit card accounts show in red if they are over the credit limit (negative balance)
**And** a total general card shows the sum of all account balances

**Given** the dashboard displays account cards
**When** a credit card account has a negative balance
**Then** the card background or border is highlighted in red to indicate over-indebtedness
**And** the balance amount is displayed in red text

**Given** the user has multiple accounts
**When** viewing the dashboard
**Then** the total general card displays the sum of all account balances
**And** the total is calculated as: Σ(initial_balance + transactions) for each account

**Dev Notes:**
- Infrastructure already exists: Account entity, IAccountRepository, ApiAccountRepository, getAccounts() server action
- Files to create:
  - src/presentation/components/dashboard/account-balance-cards.tsx - Component to display account balance cards
  - src/presentation/components/dashboard/account-card.tsx - Individual account card component
  - src/presentation/components/dashboard/total-balance-card.tsx - Total balance summary card
- Files to modify:
  - src/app/page.tsx - Add account balance cards section to dashboard
- Use existing getActiveAccounts() server action from src/app/accounts/actions.ts
- Calculate balance per account: need to sum transactions per account (may require new usecase or repository method)
- Mobile-first responsive: grid layout adapting from 1 column (mobile) to 2-3 columns (desktop)
- Follow existing design system from pp/globals.css and component patterns
- Reference: ARCHITECTURE-SPINE.md AD-8 (semantic classes, no ad-hoc colors)
- Verify with: manual test that account cards display correctly, credit cards show red when negative, total sums correctly

**Technical Requirements:**
- Server component for data fetching (use existing server actions)
- Client components for interactive UI if needed
- Responsive grid layout using Tailwind CSS
- Balance calculation may require: getAccountBalance(accountId) method in repository or usecase
- Handle loading and error states gracefully
- Format currency using existing ormatCurrency utility

**Dependencies:**
- Epic 4 (Auth + Supabase persistence) must be complete for account data to persist
- Existing account infrastructure (entity, repository, server actions) is already in place
