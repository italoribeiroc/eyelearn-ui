# Eye Learn — Frontend

Source of truth for this repo's architecture and conventions. Read this before making structural changes.

## 1. Project overview & product vision

Eye Learn is an AI-powered **visual flashcard study app**. The MVP scope of this repo is: a marketing landing page, real registration/login against the existing Django backend, and a minimal authenticated dashboard. Study features (flashcard sets, AI generation, streak tracking, progress) do not exist in the backend yet — the frontend is deliberately structured so they can be added later without a rewrite.

**Brand wordplay**: Eye → I → Aye → AI → Learn. The hero animates this progression, then flows into short phrases ending in "Learn" (e.g. "See it. Learn."). Personality: playful, energetic, motivating, modern, **credible** — inspired by Duolingo's consistency mechanics (streaks, daily goals) without copying its visual identity or tone. Never childish.

**Backend is a separate repo** (`/Users/italoribeiro/workspace/eyelearn/eyelearn`, Django 4.2 + DRF + `djangorestframework-simplejwt`). This repo never modifies it. Only six backend endpoints exist:

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register/` | `{username, email, password}` → `{user, access, refresh}` |
| POST | `/api/auth/login/` | `{username, password}` → `{access, refresh}` — **login is by username, not email** |
| POST | `/api/auth/refresh/` | `{refresh}` → `{access}` |
| GET | `/api/auth/me/` | Bearer auth → `{id, username, email}` |
| POST | `/api/auth/google/` | `{id_token}` → `{user, access, refresh}` — verifies a Google ID token, finds-or-creates a user by email, links by `google_id` |
| GET | `/` , `/api/hello/<username>/` | Trivial demo endpoints, unused by the frontend |

There is **no** logout endpoint (stateless JWT, no token blacklist), no password reset, no email verification, no waitlist, and no product/content endpoints. Do not build UI that implies these exist without a clear "coming soon" treatment.

## 2. Tech stack

- **Next.js 16** (App Router, Turbopack by default, React 19.2 canary), TypeScript strict.
- **Tailwind CSS v4** — tokens defined as CSS variables in `src/app/globals.css` via `@theme inline`, not a `tailwind.config.ts`.
- **shadcn/ui** (`style: radix-nova`, Radix via the unified `radix-ui` package, icons via `lucide-react`) — primitives live in `src/components/ui/*` and are committed source, not a dependency. `form.tsx` was hand-written (not available in this shadcn registry version) using `react-hook-form` + `radix-ui`'s `Slot`.
- **next-intl** — `[locale]` routing, default locale `en` unprefixed, `pt-BR` prefixed (`localePrefix: "as-needed"`).
- **next-themes** — `attribute="data-theme"` (not the default `class`) to match this project's CSS selectors.
- **motion** (`motion/react`) — hero word-morph animation only; respects `prefers-reduced-motion` via `useReducedMotion()` and a global CSS reduced-motion override.
- **react-hook-form + zod v4** (`@hookform/resolvers`) — client-side validation; the Django response is always the final authority on real errors.

## 3. Architecture: BFF proxy (why)

Django has **no CORS configuration** (`django-cors-headers` isn't installed) and no session/cookie auth — it's pure Bearer-JWT. Rather than adding CORS to a repo this frontend doesn't own, the browser only ever talks to this Next.js app. Route Handlers under `src/app/api/auth/*` forward requests server-to-server to Django (`EYELEARN_API_URL`, server-only env var) and store the resulting JWTs as **httpOnly cookies** (`eyelearn_access`, `eyelearn_refresh`) rather than in `localStorage` — more resistant to XSS, and avoids ever shipping tokens or the Django URL to client JS.

```
Browser → Next.js Route Handlers (src/app/api/auth/*) → Django (EYELEARN_API_URL)
        ← httpOnly cookies set by the proxy               ← {access, refresh} / {user}
```

- `lib/api/django-client.ts` — the only file allowed to read `EYELEARN_API_URL`; `import "server-only"` enforced.
- `lib/auth/session.ts` — `getCurrentUser()` (wrapped in React `cache()` so one Django request per render pass) and `refreshAccessToken()`, used both by Route Handlers and by Server Component layouts.
- Cookie **writes** only work inside Route Handlers/Server Actions (a Next.js restriction) — `lib/auth/cookies.ts` wraps every `cookies.set()` in a try/catch so a silent refresh triggered from a Server Component render (e.g. `(app)/layout.tsx`) can still fetch and use a fresh token for that render without crashing; persisting it back as a cookie happens moments later via the client-side `useAuth()` hook's request to the `/api/auth/me` Route Handler, which can write cookies.
- Auth cookie lifetimes mirror simplejwt's **defaults** (Django has no `SIMPLE_JWT` override): access 5 min, refresh 1 day. If the backend ever sets `SIMPLE_JWT` lifetimes, update `lib/auth/constants.ts` to match.
- **Logout is cookie-clear-only** (`app/api/auth/logout/route.ts`) — there's no backend endpoint to call.

Protected routes (`(app)/*`) are gated in `(app)/layout.tsx`, a Server Component calling `getCurrentUser()` and redirecting to `/login` if null — **not** in `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`; ours is scoped to next-intl locale routing only, kept separate from auth to avoid Edge-runtime cookie/fetch complications). `(auth)/layout.tsx` does the inverse: redirects an already-authenticated visitor away from `/login`/`/register` to `/dashboard`.

Client components that need to know auth state (e.g. the marketing nav's Log in/Dashboard CTA) use `useAuthContext()` (`src/context/auth-context.tsx`), backed by `hooks/use-auth.ts`, which calls the same-origin `GET /api/auth/me`.

## 4. Folder structure

```
messages/{en,pt-BR}.json          # i18n source of truth, namespaced per section/page
src/
  i18n/{routing,navigation,request}.ts
  proxy.ts                        # next-intl locale middleware ONLY (Next 16: middleware.ts → proxy.ts)
  app/
    [locale]/
      layout.tsx                  # html/body root: fonts, ThemeProvider, NextIntlClientProvider, AuthProvider
      (marketing)/                # landing page + its layout (nav/footer)
      (auth)/                     # register, login — redirect-away-if-authenticated
      (app)/                      # dashboard, study — auth-gated
    api/auth/{register,login,refresh,logout,me}/route.ts   # BFF proxy, outside [locale] (JSON, not localized HTML)
    api/auth/google/{route,callback/route}.ts               # Server-side Google OAuth Authorization Code flow (start + callback)
    globals.css                   # Tailwind v4 tokens, imported by [locale]/layout.tsx
  components/
    ui/                           # shadcn primitives
    marketing/ auth/ dashboard/   # feature-scoped components
    shared/                       # logo, theme-toggle, language-switcher, mock-flashcard (cross-feature)
  lib/
    api/{django-client,types}.ts  # server-only Django fetch wrapper + shared response types
    auth/{constants,cookies,session}.ts
    validation/{register,login}-schema.ts
  hooks/use-auth.ts
  context/auth-context.tsx
```

Future features (flashcard sets, AI generation, spaced repetition) add new `(app)/*` routes and `components/study/*` — no restructuring needed. New Django endpoints extend `lib/api/types.ts` + `django-client.ts`.

## 5. Design system

Brand: turquoise + mint (focus, trust, calm — chosen for long study sessions) with a warm coral-orange accent (`--color-brand-accent`) reserved for CTAs, streaks, and rewards so it stands out without clashing. Full semantic scale (background/surface/foreground/border/success/warning/error/info) defined **twice** — light and dark are hand-tuned, not inverted — as CSS variables in `src/app/globals.css`, consumed only via Tailwind utilities (`bg-background`, `text-brand-turquoise`, etc.) generated from the `@theme inline` block. Never hardcode hex values in components.

- Headings: **Baloo 2** (`--font-heading`, rounded/friendly, display use only). Body/UI: **Inter** (`--font-body`, legible, full pt-BR diacritic support). Both loaded via `next/font/google` in `[locale]/layout.tsx`.
- Radius scale: `sm` 8px / `md` 12px / `lg` 20px — rounded but restrained (not bubbly).
- Shadows: soft, teal-tinted in light mode (`--shadow-soft`, `--shadow-soft-lg`); dark mode leans on surface elevation instead of shadows.
- `dark:` Tailwind variant is remapped in `globals.css` (`@custom-variant dark (&:is([data-theme="dark"] *))`) to match `next-themes`' `data-theme` attribute — **do not** switch `next-themes` back to its default `class` strategy without updating this.

## 6. i18n conventions

- Add new UI copy to **both** `messages/en.json` and `messages/pt-BR.json`, namespaced to match the component/section (e.g. `hero.*`, `auth.register.*`, `dashboard.*`). Never hardcode user-facing strings in JSX.
- **Never use the em dash character ("—") in on-site copy**, in either language. The user explicitly asked for it to be removed everywhere and does not want it reintroduced. Prefer a period (splitting into two sentences), a colon when introducing a list/clause, or a comma; do not substitute a plain hyphen either. Applies to `messages/*.json` and any other user-facing string (metadata titles, aria-labels, etc.).
- Server Components: `getTranslations()` / `useTranslations()` from `next-intl`/`next-intl/server`. Client Components: `useTranslations()` from `next-intl`.
- `<Link>`/`redirect()`/`usePathname()`/`useRouter()` come from `@/i18n/navigation`, never `next/link` or `next/navigation`, so locale prefixing stays correct.
- **Known limitation**: Django's validation error messages (e.g. "A user with that username already exists.") are returned in English regardless of UI locale — the backend has no i18n/Accept-Language handling. These are passed through verbatim in `register-form.tsx`; only *our own* client-side zod validation messages are translated (`auth.validation.*`).
- **Known tradeoff**: `[locale]` pages that render a `next-intl` `<Link>` in a Server Component render dynamically (SSR per request) rather than as static HTML, even with `generateStaticParams` + `setRequestLocale` — this is a current upstream interaction between next-intl's server `getLocale()` and Next 16's static-generation analysis, not a bug in this app. Functionally unaffected; revisit if next-intl ships a fix.

## 7. Auth & data-honesty conventions

- Never fabricate backend data. Dashboard metrics with no real data source (streak, daily goal, flashcards studied) render as explicit dashed-border "Coming soon" `StatCard`s (`components/dashboard/stat-card.tsx`), never as an invented number.
- `EYELEARN_API_URL` must never be read outside `lib/api/django-client.ts` / files under `lib/auth/` / `app/api/**`. It must never gain a `NEXT_PUBLIC_` prefix.
- Registration collects **Username, Email, Password, Confirm password** (confirm is frontend-only, stripped before the request) because Django's `RegisterSerializer` requires `username` as a real, unique field and `USERNAME_FIELD` was never changed from Django's default — login is by username, not email.

## 8. Coding & component conventions

- Server Components by default; `"use client"` only where interactivity/hooks require it.
- `kebab-case.tsx` filenames, one component per file, feature-scoped folders (`marketing/`, `auth/`, `dashboard/`) vs. `shared/` for cross-feature UI.
- Prefer composing shadcn primitives (`components/ui/*`) over new one-off styled elements.
- No `any`; run `npx tsc --noEmit` before considering a change done.

## 9. Running, building, deploying

```bash
# Backend (separate repo, run alongside):
cd /Users/italoribeiro/workspace/eyelearn/eyelearn && python manage.py runserver   # http://localhost:8000

# Frontend:
npm install
cp .env.local.example .env.local   # EYELEARN_API_URL=http://localhost:8000
npm run dev                        # http://localhost:3000
npm run build && npm run start     # production build/serve
npm run lint
npx tsc --noEmit
```

**Vercel**: standard Next.js App Router auto-detection, no `vercel.json` needed. Set `EYELEARN_API_URL` in Project Settings → Environment Variables, server-only, scoped per environment:
- Production → `https://eyelearn-smoky.vercel.app` (backend prod)
- Preview → `https://eyelearn-staging.vercel.app` (backend staging)

No `NEXT_PUBLIC_*` vars are needed since the browser never talks to Django directly.

## 10. Key decisions log

- **BFF proxy over direct CORS calls**: Django has zero CORS config; adding it would mean modifying a repo this frontend doesn't own. The proxy also upgrades token storage to httpOnly cookies "for free."
- **Username field shown at registration, login by username not email**: matches the backend's actual contract (`USERNAME_FIELD` is `username`; email is unique/required but not a login credential).
- **Registration is real signup, not a waitlist**: the backend's `/api/auth/register/` creates real accounts immediately; the prompt's "waitlist" framing was intentionally not implemented since it would be dishonest UI for a fully-working signup endpoint.
- **`(app)/dashboard` metrics as "Coming soon" shells**: no backend data source for streak/goal/cards-studied exists yet; a real UI shell was built without pretending the numbers are real.
- **`getCurrentUser()` wrapped in React `cache()`**: `(app)/layout.tsx`'s auth gate and `dashboard/page.tsx` both need the current user; caching avoids two Django round-trips per request.
- **Single `StatCard` primitive instead of separate `streak-card`/`progress-card` files**: they'd have been near-identical prop-preset wrappers: avoided per this repo's "no unnecessary abstraction" convention.
- **Google sign-in as a server-side OAuth Authorization Code flow, not a client-side SDK**: `src/app/api/auth/google/route.ts` redirects to Google, `src/app/api/auth/google/callback/route.ts` exchanges the code and forwards the resulting ID token to Django's `/api/auth/google/`, then sets the same httpOnly cookies as password login. No Google Identity Services JS ever runs in the browser and no `NEXT_PUBLIC_*` var was introduced (`GOOGLE_OAUTH_CLIENT_ID`/`_SECRET`/`_REDIRECT_URI` are server-only), keeping the "browser only ever talks to Next.js" BFF invariant intact.
- **Pricing is priced per locale, not converted at render time**: `components/marketing/pricing.ts` has a separate USD (`en`) and BRL (`pt-BR`) tier table, each with its own round-number monthly/annual prices and its own discount, rather than computing BRL as a currency conversion of the USD price. `PricingSection` is a client component (`"use client"`, needs `useState` for the Monthly/Annual toggle) that reads `useLocale()` to pick the right table and formats amounts via `Intl.NumberFormat(locale, { style: "currency", currency })`. Still fully illustrative -- no billing backend exists.
