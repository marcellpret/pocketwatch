# 🕰️ Pocketwatch

A small, self-hosted personal finance tracker. Track what you spend, what you earn, and where the money goes — across as many budgets ("workspaces") as you need, with people you choose.

Built with **Nuxt 4**, **Vue 3**, **Tailwind CSS v4** and **Supabase** (Postgres + Auth).

## Features

- **Workspaces** — keep budgets separate. Create unlimited workspaces, switch between them from the header, and invite others to collaborate.
- **Owner & members** — the creator always owns a workspace; owners can edit and delete it, and invite teammates by email. Invitees accept or decline on their first login.
- **Dashboard** — monthly **balance**, **income** and **spent** at a glance, with month navigation.
- **Transactions** — log expenses and income with an amount, category, date and optional note. Filter by **type**, **category** and **month**, or flag a recurring monthly transaction.
- **Categories** — every workspace starts with 13 sensible defaults (seeded automatically). Add, rename or delete your own — each workspace keeps its own set.
- **Settings** — manage workspaces (create / edit / delete), members, invitations and preferences from one place.
- **Auth** — email/password sign-up and sign-in backed by Supabase Auth with SSR session handling.
- **Theming** — light & dark mode with a manual toggle.

## Tech Stack

| Layer    | Choice |
| -------- | ------ |
| Framework | [Nuxt 4](https://nuxt.com) (Vue 3, server-side rendering) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Backend | [Supabase](https://supabase.com) — Postgres, Auth, RLS, pgREST |
| Icons | [lucide-vue-next](https://lucide.dev) |
| Language | TypeScript |

## Getting Started

### Prerequisites

- Node.js 20+ and your favourite package manager (`pnpm`, `npm`, `bun`, …)
- A [Supabase](https://supabase.com) project (cloud or self-hosted)

### Setup

```bash
# 1. Install dependencies
pnpm install   # or: npm install / yarn / bun install

# 2. Configure environment variables
cp .env.example .env
```

`.env` needs the public connection details from your Supabase project (Project Settings → API):

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-publishable-or-anon-key>
```

> Keys are only read at build/runtime — keep the `.env` file out of version control (it is gitignored).

### Database

The schema is defined by SQL migrations applied to your Supabase project (e.g. via the Supabase Dashboard's SQL editor, the Supabase CLI, or CI):

```bash
supabase link --project-ref <project-ref>
supabase db push
```

It creates five tables under RLS:

- `workspaces` — the budgets (owner, name, optional description, join code)
- `workspace_members` — who belongs to which workspace
- `workspace_invitations` — pending / accepted / declined invites
- `categories` — per-workspace expense & income categories
- `transactions` — the money movements, linked to a workspace and a category

A trigger seeds each new workspace with 13 default categories; a `postgres`-owned helper function (`private.user_workspace_ids()`) breaks RLS recursion so members can read only what they belong to, and workspace edits/deletes are restricted to owners.

## Development

```bash
pnpm dev        # start the dev server on http://localhost:3000
pnpm typecheck  # run vue-tsc / nuxt type checking
pnpm build      # production build
pnpm preview    # preview the production build locally
```

## Project Structure

```
app/
  components/     # UI components (dialogs, switcher, forms)
  composables/    # shared state & logic (auth, workspace, invitations, theme)
  layouts/        # auth + default (app shell) layouts
  pages/          # index, add, transactions, categories, settings, login, register
  types/          # generated Supabase database types
  utils/          # supabase client factory & helpers
```

## License

MIT