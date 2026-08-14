# Eye Learn — Frontend

AI-powered visual flashcard study app. This is the Next.js frontend; see [`CLAUDE.md`](./CLAUDE.md) for full architecture, design system, and conventions.

## Prerequisites

- Node.js 20.9+ and npm
- The [Eye Learn Django backend](/Users/italoribeiro/workspace/eyelearn/eyelearn) running locally (or a deployed instance to point at)

## Setup

```bash
npm install
cp .env.local.example .env.local
```

Edit `.env.local` and point `EYELEARN_API_URL` at your running Django backend (defaults to `http://localhost:8000`).

Start the backend in a separate terminal:

```bash
cd /Users/italoribeiro/workspace/eyelearn/eyelearn
python manage.py runserver
```

Then start the frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev         # start dev server (Turbopack)
npm run build        # production build
npm run start         # serve the production build
npm run lint          # ESLint
npx tsc --noEmit      # type-check
```

## Environment variables

| Variable | Scope | Notes |
|---|---|---|
| `EYELEARN_API_URL` | Server-only | Base URL of the Django backend. Never prefix with `NEXT_PUBLIC_` — the browser never talks to Django directly, only this app's own API routes do (see [`CLAUDE.md`](./CLAUDE.md#3-architecture-bff-proxy-why)). |

## Deploying to Vercel

1. Import this repo into Vercel (standard Next.js App Router project, auto-detected — no `vercel.json` needed).
2. In Project Settings → Environment Variables, set `EYELEARN_API_URL` per environment:
   - **Production** → `https://eyelearn-smoky.vercel.app`
   - **Preview** → `https://eyelearn-staging.vercel.app`
   - **Development** (only used by `vercel dev`) → `http://localhost:8000`, or leave unset and rely on `.env.local`
3. Deploy. No other configuration is required — pushing to `main` deploys to Production against the prod backend, any other branch/PR gets a Preview deployment against the staging backend.

## Project structure

See [`CLAUDE.md`](./CLAUDE.md) for the full folder structure, design system, i18n/auth conventions, and the key architectural decisions made in this repo (in particular, why API calls go through this app's own `/api/auth/*` routes instead of calling Django directly from the browser).
