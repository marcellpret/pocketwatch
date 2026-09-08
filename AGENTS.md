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
4. Run relevant tests.
5. Run typecheck/build/lint where applicable.
6. Fix any failures.
7. Confirm every requested requirement has been implemented.

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

# Budgets (feat/budgets)

Recurring monthly budgets are tracked per expense category:

- Table `budgets` (Supabase cloud): `id`, `workspace_id` FK → workspaces (cascade), `category_id` FK → categories (cascade), `amount numeric > 0`, timestamps, `UNIQUE (workspace_id, category_id)`. RLS = "members ... workspace budgets" read/insert/update/delete via the standard `workspace_members` EXISTS pattern. Type registered in `app/types/database.ts`.
- `useBudgets()` composable (`app/composables/useBudgets.ts`): `budgets` state, `loadBudgets`, `upsertBudget(categoryId, amount)` (upsert on `workspace_id,category_id` conflict), `removeBudget(categoryId)`, `budgetFor`.
- `BudgetDialog` component edits a category's monthly budget amount (one recurring value per category).
- `SummaryCard` is the shared "big colorful card" component (used by the Balance card and the `/budgets` totals card). Props: `title`, `variant` (`brand` gradient = main page, `alt` slate gradient = budgets page), `monthControl` (compact abbreviated month label via `monthLabelShort` + prev/next/Today, `defineModel('month')`), `actionLabel`/`actionDisabled` (full-width action button rendered as the last element).
- `/budgets` page: no outer page title; `SummaryCard` (variant `alt`, month control + "Add budget" action) with budgeted/spent/left totals and progress, then "X of Y categories budgeted" and per-category rows vs current-month expense spending.
- Dashboard (`app/pages/index.vue`) shows a subtle "Budgets this month" section styled like Recent activity (plain bordered `bg-card`, slate accents matching the budget view — not a `SummaryCard`). Per-category progress is the focus; the spent/of/left totals are a small footnote. "Manage" link in the section header.
- Bottom nav in `app/layouts/default.vue` is now 5 columns (Home, Activity, Add, Budget, More).

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
