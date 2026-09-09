# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-09-09

### Added
- Recurring monthly budgets per expense category, with an "Add budget" picker that lists only unbudgeted categories.
- Budget page showing budgeted / spent / left totals plus per-category progress vs current-month spending.
- Dashboard "Budgets this month" section emphasizing per-category progress.
- 5-slot bottom navigation with a dedicated Budget tab.
- Shared `SummaryCard` component (used by the Balance and budget summary cards) with a compact month selector and an action button.

## [0.1.0] - 2026-09-05

### Added
- Initial Pocketwatch app: Nuxt 4 / Vue 3 SPA with Tailwind CSS v4 and Supabase (Postgres, Auth, RLS).
- Email/password sign-up and sign-in with SSR session handling and an auth guard middleware.
- Core finance pages: dashboard (Home), Activity, Add/Edit transaction, Categories, and Settings.
- Workspaces (formerly "household") with multi-workspace support, member invitations, and join codes.
- Per-workspace expense & income categories with colors; 13 defaults seeded automatically per new workspace.
- Transaction tracking with amount, category, date, optional note, and recurring (monthly) flag.
- Light and dark theme with a manual toggle.
- Agent implementation rules (`AGENTS.md`).

### Changed
- Auth user + loading state shared app-wide via `useState`; session refresh moved to the auth middleware.
- Supabase client creation reworked for reliable browser/SSR client handling.
- Renamed "household" to "workspace" throughout the app and database.

### Fixed
- Dependency declarations (`@vueuse/*`, `@supabase/ssr`, `h3`, `reka-ui`) so the Vercel build resolves.
- Date display in `dd.mm.yyyy` format and amount parsing for comma decimals.
- Runtime config resolution in the Supabase client factory and theme toggle icon flicker.