# 9itchi Client
Next.js UI for students (`candidate`) and admins. Owns no data: calls the Go services through Axios (proxy in prod) and Ably for live chat/notifications. Port 3000.

## Stack
Next.js 15.1 (App Router, standalone, turbopack dev), React 19, TypeScript, Tailwind 3, NextAuth v5 beta, next-intl 4, TanStack Query 5, Axios, Ably 2, Vitest 3, Playwright.

## Layout
- `src/app/`: public `/`, `/offres/[id]` (shared offer), `/privacy-policy`, `/terms-conditions`, `/auth/callback`; `auth/` signin, signup, forgot-password, reset-password; `(onboarding)/` preferences, resumes/upload; `(protected-pages)/` student pages (jobs, books, resumes, applications, outreach, emails/compose, notifications, support, settings/{alerts,billing,gmail}) and `admin/` (books, jobs, plans, promo-codes, sources, stats, support, templates, users).
- `src/app/api/`: `auth/[...nextauth]`, `proxy/[service]/[...path]`.
- `src/services/` one file per backend (no `AiService`: AI goes through resume/email/job), `src/hooks/use*.ts` (TanStack Query), `src/configs/` (services, routes, auth, navigation), `src/context/`, `src/components/`, `src/i18n/`, `messages/{fr,en,ar}.json`, `src/__tests__/`, `e2e/`, `infra/`.

## Rules
- Base URLs only via `configs/services.config.ts`: `NEXT_PUBLIC_USE_PROXY=true` -> `/api/proxy/<svc>`, else `NEXT_PUBLIC_<SVC>_API_BASE_URL`; server side prefers `<SERVICE>_API_URL`.
- Proxy forwards only `authorization`, `content-type`, `accept`, `accept-language`; 404 on `internal/` paths and unknown services, 502 when a service is down. Never call `/internal/*` from the client.
- Auth: two Credentials providers, `credentials` (email/password via account-api) and `tokens` (tokens returned by account-api after Google/LinkedIn). Send the account-api token as `Authorization: Bearer {token}`, not the NextAuth session token. Dedup in-flight refresh in Axios interceptors. `SessionProvider refetchInterval={5*60}`. Read-only consumers use `SessionContext`.
- Role gating: `src/middleware.ts` + `configs/routes.config` `protectedRoutes`. After login a student lands on jobs (`/dashboard` redirects).
- i18n: next-intl, no locale in URL; `NEXT_LOCALE` cookie, then `Accept-Language`, else `fr`. `ar` is RTL (`dirOf`). TZ `Africa/Tunis`. Every new string goes in all three `messages/*.json`.
- Ably: token via `authCallback` from `GET /notifications/ably-token` (channel `user:{id}`) and `GET /chat/ably-token` (channel = conversation id). Clients never publish.
- Keep backend field names (`id`, `role`, `status`, `tracking_id`). Server components by default; `"use client"` only when needed. Invalidate the right query keys after mutations. No new UI libraries without need.
- Paywall: 402 from services means quota/subscription; show the subscription UI, don't treat it as an error.

## UI style
- Tokens only from `tailwind.config.ts` (from the canvas): `ink`, `lime`, `violet`, `ember`, `page`, `line`, `fill`, `ok`, `warn`, `cv`; fonts `sans` (Inter), `display` (Bricolage), `mono`; shadows `card`/`pop` (hard offset), `nav`, `paper`, `toast`. No raw hex unless already the pattern nearby.
- Reuse `src/components/ui/` first (`Button`/`buttonClass`, `Field`, `Modal`, `Segmented`, `Toast`, `icons`, `Logo`, `PagePlaceholder`), merge classes with `cn` (`@/lib/cn`); feature components live in `src/components/<feature>/`. Extract a shared component only when a second use appears.
- Simple student flow: one clear primary action per screen, loading/empty/error states, works at 390 px and in `ar` RTL (logical `ms-`/`me-`/`start`/`end`).
- Mockups: `../9itchi PFE — Web App Design.html` (large: grep the screen id, don't read whole).
- Prettier: no semicolons, single quotes, 4 spaces, width 160, trailing commas. ESLint `next lint`.

## Tests and CI
- `npm test` (Vitest, `src/__tests__/`), `npm run e2e` (Playwright, port 3101, `NEXT_PUBLIC_USE_PROXY=false`, services mocked at `http://e2e.test/<svc>` in `e2e/services.ts`).
- Workflows: `ci.yml` (PR: lint, test, build), `e2e.yml` (PR: Playwright chromium), `build.yml` (main: docker build + push to ghcr, then dispatch; fails at dispatch while `DISPATCH_TOKEN` secret is missing).

## Commands
`npm install --legacy-peer-deps`, `npm run dev`, `npm run build`, `npm run lint`, `npm run prettier` / `prettier:fix`, `npm test`, `npm run e2e`.
Local full stack: `infra/docker-compose.yml` (Postgres 16, RabbitMQ, 11 services built from sibling dirs, client), reads `infra/.env` (template `infra/.env.example`). `infra/.env*` except `.env.example` are gitignored: never commit or print them.
