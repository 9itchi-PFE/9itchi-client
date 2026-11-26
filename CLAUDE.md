# 9itchi Client
Next.js UI for students (`candidate`) and admins. Owns no data: calls the Go services through Axios (proxy in prod) and Ably for live chat/notifications. Port 3000.

## Stack
Next.js 15.1 (App Router, standalone, turbopack dev), React 19, TypeScript, Tailwind 3, NextAuth v5 beta, next-intl 4, TanStack Query 5, Axios, Ably 2, Vitest 3, Playwright.

## Layout
- `src/app/`: public `/`, `/offres/[id]` (shared offer), `/privacy-policy`, `/terms-conditions`, `/cookies`, `/auth/callback`, plus `robots.ts`, `sitemap.ts`, `favicon.ico`/`icon.png`/`apple-icon.png` (kept out of the middleware); `auth/` signin, signup, forgot-password, reset-password; `(onboarding)/` preferences, resumes/upload; `(protected-pages)/` student pages (jobs, books, resumes, applications, outreach, emails/compose, notifications, support, settings/{alerts,billing,gmail}) and `admin/` (books, jobs, plans, promo-codes, sources, stats, support, templates, users).
- `src/app/api/`: `auth/[...nextauth]`, `proxy/[service]/[...path]`.
- `src/services/` one file per backend (no `AiService`: AI goes through resume/email/job), `src/hooks/use*.ts` (TanStack Query), `src/configs/` (services, routes, auth, navigation), `src/context/`, `src/components/`, `src/i18n/`, `messages/{fr,en,ar}.json`, `src/__tests__/`, `e2e/`, `infra/`.

## Rules
- Base URLs only via `configs/services.config.ts`: `NEXT_PUBLIC_USE_PROXY=true` -> `/api/proxy/<svc>`, else `NEXT_PUBLIC_<SVC>_API_BASE_URL`; server side prefers `<SERVICE>_API_URL`.
- Proxy forwards only `authorization`, `content-type`, `accept`, `accept-language` and the byte-range headers (`range`, `if-range`, `if-none-match`, for the book PDF read page by page); 404 on `internal/` paths and unknown services, 502 when a service is down. Never call `/internal/*` from the client.
- Auth: two Credentials providers, `credentials` (email/password via account-api) and `tokens` (tokens returned by account-api after Google/LinkedIn). Send the account-api token as `Authorization: Bearer {token}`, not the NextAuth session token. Dedup in-flight refresh in Axios interceptors. `SessionProvider refetchInterval={5*60}`. Read-only consumers use `SessionContext`.
- Role gating: `src/middleware.ts` + `configs/routes.config` `protectedRoutes`. After login a student lands on jobs (`/dashboard` redirects).
- i18n: next-intl, no locale in URL; `NEXT_LOCALE` cookie, then `Accept-Language`, else `fr`. `ar` is RTL (`dirOf`). TZ `Africa/Tunis`. Every new string goes in all three `messages/*.json`.
- Ably: token via `authCallback` from `GET /notifications/ably-token` (channel `user:{id}`) and `GET /chat/ably-token` (channel = conversation id). Clients never publish.
- Keep backend field names (`id`, `role`, `status`, `tracking_id`). Server components by default; `"use client"` only when needed. Invalidate the right query keys after mutations. No new UI libraries without need.
- Paywall: 402 from services means quota/subscription; show the subscription UI, don't treat it as an error.
- Plan texts for students come from `plan.details[locale]` (label, tagline, features) via `planText(plan, locale)` in `components/billing/billing.ts` (fallback fr, then `plan.name`); the admin edits them per language in PlanModal.

## UI style
- Tokens only from `tailwind.config.ts` (from the canvas): `ink`, `lime`, `violet`, `ember`, `page`, `line`, `fill`, `ok`, `warn`, `cv`; fonts `sans` (Inter), `display` (Bricolage), `mono`; shadows `card`/`pop` (hard offset), `nav`, `paper`, `toast`. No raw hex unless already the pattern nearby.
- Reuse `src/components/ui/` first (`Button`/`buttonClass`, `Field`, `Modal`, `ConfirmDialog` (use instead of `window.confirm`), `Segmented`, `Toast`, `icons`, `Logo`, `PagePlaceholder`), merge classes with `cn` (`@/lib/cn`); feature components live in `src/components/<feature>/`. Extract a shared component only when a second use appears.
- Simple student flow: one clear primary action per screen, loading/empty/error states, works at 390 px and in `ar` RTL (logical `ms-`/`me-`/`start`/`end`).
- Mockups: `../9itchi PFE — Web App Design.html` (large: grep the screen id, don't read whole).
- Prettier: no semicolons, single quotes, 4 spaces, width 160, trailing commas. ESLint `next lint`.

## Responsive (every new screen and component)
- Mobile first: build at 360px, then widen with `sm` 640, `md` 768, `lg` 1024 (the header switches to the pill nav, detail panels sit beside lists), `xl` 1280. Content is at most 1320px wide. On a phone the sections are a bar fixed at the bottom (`StudentLayout` reserves 76px under `main`): never put content or fixed controls beneath it.
- No fixed widths: `w-full max-w-[…]`, `min-w-0` on flex children, `flex-wrap` / `flex-[1_1_Npx]` columns. A table or wide bar scrolls inside its own `overflow-x-auto` (add `scroll-hint-x` for a visible edge); the page itself never scrolls sideways.
- Full-height screens use `min-h-screen min-h-dvh` (dvh follows the mobile browser bars). Sticky or fixed panels only from `lg:` (`lg:sticky`). Bottom bars add `pb-[env(safe-area-inset-bottom)]`.
- Text fields are 16px on phones: `globals.css` forces it, because iOS Safari zooms the page for a smaller field. Do not fight that rule.
- Touch: a control is at least 32px on its short side. Text links and compact buttons under 44px take the `hit` class (an invisible 44px touch area on touch screens). A field inside a `<label>` counts as the whole label. Keep the visible focus ring (global base rule).
- When an action changes something out of sight on a small screen (selecting an offer, a topic), bring it into view under 1024px and give a way back: see `OffersScreen.selectOffer` and `#offers-list`.
- Text: labels and captions 11px at least, body 14px at least; under 10px only for decorative marks.
- Verify with `npx playwright test e2e/responsive.spec.ts`: it opens public, student and admin pages on a 360px phone and a 768px tablet (touch) and fails on sideways scroll, elements outside the screen, fields under 16px, and tap targets under 32px without `hit`. Add every new route to the lists in that spec. For a visual check, screenshot at 360, 768 and 1280.

## Tests and CI
- `npm test` (Vitest, `src/__tests__/`), `npm run e2e` (Playwright, port 3101, `NEXT_PUBLIC_USE_PROXY=false`, services mocked at `http://e2e.test/<svc>` in `e2e/services.ts`).
- Workflows: `ci.yml` (PR: lint, test, build), `e2e.yml` (PR: Playwright chromium), `build.yml` (main: docker build + push to ghcr, then dispatch; fails at dispatch while `DISPATCH_TOKEN` secret is missing).

## Commands
`npm install --legacy-peer-deps`, `npm run dev`, `npm run build`, `npm run lint`, `npm run prettier` / `prettier:fix`, `npm test`, `npm run e2e`.
Local full stack: `infra/docker-compose.yml` (Postgres 16, RabbitMQ, 11 services built from sibling dirs, client), reads `infra/.env` (template `infra/.env.example`). `infra/.env*` except `.env.example` are gitignored: never commit or print them.
