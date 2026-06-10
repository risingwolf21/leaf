# Leaf

A clean markdown note-taking PWA built with React, Vite, Supabase, and shadcn/ui.

## Tech Stack

- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Postgres)
- React Router
- `marked` for markdown rendering
- `vite-plugin-pwa` for offline/installable support

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Create a Supabase project, then:

1. Enable **Email/Password** auth (Authentication → Providers).
2. Set the Site URL and add a Redirect URL pointing at your deployed app
   (e.g. `https://username.github.io/leaf`).
3. Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql) in the
   Supabase SQL editor to create the `notes` table, trigger, and row level
   security policies.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in your project's values:

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the dev server

```bash
npm run dev
```

## Scripts

- `npm run dev` – start the Vite dev server
- `npm run build` – type-check and build for production
- `npm run preview` – preview the production build locally
- `npm run lint` – run ESLint

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the app
and publishes `dist/` to the `production` branch for GitHub Pages. Set the
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` repository secrets for the
build step, and configure GitHub Pages to serve from the `production` branch.
