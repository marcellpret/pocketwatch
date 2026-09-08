# Implementation Rules

## Do not stop early

When given an implementation task, continue working until the requested functionality is fully implemented.

Do not stop merely because:
- one part of the feature works
- the code compiles
- you have explained the remaining work
- the task is large
- the current response is getting long

Use the available tools to inspect files, edit code, run tests, and verify the result.

## Large tasks

For large implementations, work incrementally.

After completing a meaningful piece:
1. Save the changes.
2. Check the current implementation.
3. Continue with the remaining requirements.

If the conversation context becomes large, rely on the repository, git diff, tests, and existing files as the source of truth.

If context compaction occurs, immediately reassess the original task and continue from the current repository state.

Do not restart completed work.

## Before finishing

Before declaring the task complete:

1. Review the original requirements.
2. Inspect git diff/status.
3. Search for unfinished TODOs/placeholders related to the task.
4. Look for any changes that should be reflected in the Project Context section below and update it.
5. Run relevant tests.
6. Run typecheck/build/lint where applicable.
7. Fix any failures.
8. Confirm every requested requirement has been implemented.

Only declare completion when the implementation is actually complete.

# Versioning & Changelog

Releases follow **Semantic Versioning** (`major.minor.patch`) and are recorded in `CHANGELOG.md` (Keep a Changelog format). The `version` field in `package.json` is the source of truth for the current release.

## Process

1. Work is done on feature branches and merged to `main` only after testing.
2. Every feature branch adds its own entry under the `## [Unreleased]` section of `CHANGELOG.md`, in the applicable subheading (`Added`, `Changed`, `Fixed`, `Removed`, etc.). Merge the feature to `main`; the entry stays under Unreleased.
3. When cutting a release:
   - Create a new dated `## [x.y.z]` section at the top and move the accumulated Unreleased changes into it (replacing Unreleased with a fresh empty section).
   - Bump `version` in `package.json` to `x.y.z`.
   - Do not create git tags unless explicitly asked.
4. Keep entries short, user-facing, and grouped by heading.

# Project Context

This section is the canonical summary of the codebase. Use it instead of re-exploring the repo.

**Keep this section up to date.** Whenever you add, change, or remove anything meaningful (new files, new routes/endpoints, schema changes, new env vars, dependency changes, new patterns, updated commands), update this section in the same session. Review it as part of the "Before finishing" checklist. If the repo has drifted from what is written here, update this section to match reality.

## What this is

**Pocketwatch** — a small, self-hosted personal finance tracker (Nuxt 4/Vue 3 SPA + Supabase). Track expenses and income across "workspaces" (budgets) shared with other users via email invitations.

## Tech stack

- **Framework:** Nuxt 4 (Vue 3, SSR) + TypeScript
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`)
- **Backend:** Supabase — Postgres, Auth (email/password), RLS, pgREST
- **Server utilities:** `h3` (event handler types for API routes)
- **UI:** `reka-ui` (dialogs, dropdowns), `lucide-vue-next` (icons), `@vueuse/core` (state)
- **Package manager:** pnpm

## Commands

- `pnpm dev` — dev server on http://localhost:3000
- `pnpm typecheck` — vue-tsc / nuxt type checking
- `pnpm build` — production build
- `pnpm preview` — preview production build
- No test script exists. No per-file ESLint config; rely on `pnpm typecheck`.

## Environment

`.env` (gitignored), exposed via `runtimeConfig.public` in `nuxt.config.ts`:
- `SUPABASE_URL=https://<project-ref>.supabase.co` (current ref: `ggrtpkdoyhiqjzoduxda`)
- `SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`

## Project structure

```
app/
  assets/css/main.css      # Tailwind entry
components/              # ApplePaySync, AutoCategorization, BudgetDialog, CategoryDialog, SummaryCard, TransactionForm, TransactionRow, WorkspaceDialog, WorkspaceSwitcher
   composables/             # useApplePay, useAuth, useBudgets, useInvitations, useSupabase, useTheme, useWorkspace
   layouts/                 # auth.vue, default.vue (app shell); bottom nav has 5 slots: Home, Activity, Add, Budget, More
   middleware/auth.global.ts
   pages/                   # index (dashboard), add, transactions, categories, budgets, settings, login, register
   types/                   # database.ts (generated Supabase types), transactions.ts
   utils/                   # supabase.ts (client factory), format.ts
server/
   routes/api/apple-pay/transactions.post.ts   # webhook receiving Shortcuts → Supabase
   utils/                   # supabase.ts (server client), amount.ts (webhook amount parser)
```

## Database schema (Supabase cloud, RLS enforced)

Tables (in `app/types/database.ts`, `Database['public']['Tables']`):
- `workspaces` — `id`, `name`, `description`, `owner_id`, `join_code`, `created_at`
- `workspace_members` — `workspace_id`, `user_id`, `created_at`
- `workspace_invitations` — `id`, `workspace_id`, `email`, `invited_by`, `status` (pending/accepted/declined), `created_at`
- `categories` — `id`, `workspace_id`, `name`, `type` ('expense'|'income'), `color`, `created_at`
- `budgets` — `id`, `workspace_id` FK → workspaces (cascade), `category_id` FK → categories (cascade), `amount numeric > 0`, timestamps, `UNIQUE (workspace_id, category_id)`; one recurring monthly budget per expense category
- `transactions` — `id`, `workspace_id`, `user_id`, `category_id`, `type` ('expense'|'income'), `amount` (number), `currency`, `frequency`, `occurred_on` (date), `description`, `external_ref` (nullable, unique), `source` (nullable; `'apple_pay'` for webhook rows), timestamps
- `merchant_rules` — `id`, `workspace_id`, `match` (case-insensitive substring), `category_id`, `created_at`; for auto-categorizing Apple Pay webhook purchases
- `webhook_tokens` — `id`, `token_hash` (sha256 hex), `user_id`, `workspace_id`, `currency` (default 'EUR'), `last_used_at`, `revoked_at`, `created_at`; raw token is generated client-side and shown once, only the hash is stored

Functions (in `Database['public']['Functions']`):
- `accept_invitation(p_invite_id)`
- `delete_workspace(p_workspace_id)`
- `webhook_insert_transaction(p_token, p_amount, p_merchant, p_occurred_on, p_currency, p_external_ref)` — SECURITY DEFINER public RPC used by the Apple Pay webhook; validates token (error `INVALID_TOKEN`), amount>0 (`INVALID_AMOUNT`), no expense category found (`NO_CATEGORY`); idempotent on `external_ref`, dedups on (workspace, amount, date, merchant); matches merchant_rules; inserts `source='apple_pay'`, `frequency='one_time'`; execute granted to `anon` only (flagged `anon_security_definer_function_executable`, intentional)

Notable DB mechanics:
- A trigger seeds each new workspace with 13 default categories.
- RLS uses a `postgres`-owned helper `private.user_workspace_ids()` to break RLS recursion and grant members access only to workspaces they belong to. Owners can edit/delete their workspaces.
- **Schema has no local migration files.** Schema changes are applied directly to the Supabase cloud project (Dashboard SQL editor, CLI, or MCP). There is a Supabase MCP server available with access to the project.

## Key patterns to follow

- **Supabase client:** `app/utils/supabase.ts` — `createSupabaseClient()` returns a browser or SSR client from `@supabase/ssr` based on `import.meta.server`. `useSupabase()` composable wraps it. No env fallbacks; null-safe access via runtime config.
- **Auth state:** `useAuth()` holds `useState<User>` ('auth-user'), exposes `init`, `refresh`, `signIn`, `signUp`, `signOut`. Guarded by `middleware/auth.global.ts` (checks user session, refreshes via `supabase.auth.getUser()` on server).
- **Workspace state:** `useWorkspace()` uses `useState` shared state ('workspaces', 'workspace', 'workspace-categories'), current workspace ID persisted in `localStorage` under `pocketwatch:current-workspace`.
- **Pass typed Database generic** to all Supabase calls (`useSupabase<Database>()` / `SupabaseClient<Database>`).
- **Type aliases** live in `app/types/transactions.ts` (`TransactionRow`, `CategoryRow`, `TransactionWithCategory`).
- Path alias `~` → app root.
- Do not add code comments unless asked.

## API routes

Server endpoints use Nuxt `server/routes/` + `h3` (`defineEventHandler`, `readBody`):

- `POST /api/apple-pay/transactions` — Apple Pay webhook. Implements its own bearer-token auth from the `Authorization` header (not Supabase session); calls `webhook_insert_transaction`. Returns 401 `invalid_token`, 400 `invalid_amount`/`invalid_date`/`invalid_body`, 422 `no_category`, 200 `{ ok, transaction }`.
- Client side: `useApplePay()` composable wraps token/rules CRUD; `ApplePaySync` + `AutoCategorization` components render in Settings. Raw tokens are generated + sha256-hashed in the browser (`crypto.subtle`) before insert; the plaintext is shown once. Rows with `needs_review` are highlighted in the activity list, and editing one shows a review banner in `TransactionForm` that can save a merchant rule (`match` = description, `category_id` = chosen category) and clears the flag.

## Budgets

Recurring monthly budgets are tracked per expense category:

- `useBudgets()` composable (`app/composables/useBudgets.ts`): `budgets` state, `loadBudgets`, `upsertBudget(categoryId, amount)` (upsert on `workspace_id,category_id` conflict), `removeBudget(categoryId)`, `budgetFor`.
- `BudgetDialog` component edits a category's monthly budget amount (one recurring value per category).
- `SummaryCard` is the shared "big colorful card" component (used by the Balance card and the `/budgets` totals card). Props: `title`, `variant` (`brand` gradient = main page, `alt` slate gradient = budgets page), `monthControl` (compact abbreviated month label via `monthLabelShort` + prev/next/Today, `defineModel('month')`), `actionLabel`/`actionDisabled` (full-width action button rendered as the last element).
- `/budgets` page: no outer page title; `SummaryCard` (variant `alt`, month control + "Add budget" action) with budgeted/spent/left totals and progress, then "X of Y categories budgeted" and per-category rows vs current-month expense spending. The card is always rendered so the "Add budget" action stays reachable: its content slot shows the totals/progress when budgets exist, a "No budgets yet" message when no category is budgeted, or an "Add some" link to `/categories` when there are no expense categories.
- Dashboard (`app/pages/index.vue`) shows a subtle "Budgets this month" section styled like Recent activity (plain bordered `bg-card`, slate accents matching the budget view — not a `SummaryCard`). Per-category progress is the focus; the spent/of/left totals are a small footnote. "Manage" link in the section header.

Spent per category = sum of expense transactions whose `occurred_on` falls in the viewed month, consistent with the dashboard and Activity views.

# Test accounts

Dev/test accounts created directly in the Supabase auth tables (via SQL, no email confirmation flow). Reusable for manual E2E testing in the browser and the Supabase SQL editor.

- Email: `test@pocketwatch.dev`
- Password: `test-password-123`
- ID: `49f6fa5a-1c93-4196-9241-5156f092ad89` (confirmed, identity present)

Gotchas when creating more manually in `auth`:
- `confirmed_at` and `auth.identities.email` are **generated columns** — do not insert them.
- The `auth.users` email unique index is partial: `users_email_partial_key ... WHERE (is_sso_user = false)`, so `ON CONFLICT (email)` needs that predicate.
- GoTrue expects token/string columns (`confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`, `email_change_token_current`, `reauthentication_token`, `phone_change`, `phone_change_token`) to be non-NULL (empty string) or sign-in fails with `500: Database error querying schema`.
