# 9itchi Client

Next.js frontend for the 9itchi platform (candidates and admins). Stateless proxy layer: owns no data, everything comes from backend microservices via Axios, with real-time chat/notifications over Ably.

## Stack
Next.js 15 (App Router, standalone output), React 19, TypeScript, Tailwind, NextAuth v5 (Credentials + Google), TanStack Query, Axios.

## Layout
`src/app/auth/` login/signup, `src/app/(protected-pages)/` authenticated pages (candidate + `admin/`), `src/app/api/` (auth + `/api/proxy/[service]`), `src/components/` (incl. `axios/AxiosProvider.tsx`, `auth/`, `layouts/`), `src/configs/` (app, auth, routes, navigation, services), `src/services/` (one file per backend), `src/hooks/` (query hooks), `src/utils/`, `src/types/`, `src/constants/`, `src/context/`.

## Rules
- Dev with `NEXT_PUBLIC_USE_PROXY=false` calls backends directly; production goes through `/api/proxy/[service]`. A new API call gets its base URL from `configs/services.config.ts`.
- The service auth token is an AES-GCM encrypted JWT from account-api, not the NextAuth session token. Always send `Authorization: Bearer {token}`.
- Dedup the in-flight token refresh in Axios interceptors; never leave `refetchInterval` ambiguous (`0` or `5 * 60`).
- Read-only session consumers use `SessionContext`, not `useSession()`.
- Chat uses `conversationId` as the Ably channel name. Notifications arrive on `user:{id}` channels.
- Do not rename backend fields the UI depends on (`id`, `role`, `status`, `tracking_id`).
- Server components by default; `"use client"` only when needed. Add no new UI libraries without need. Invalidate the right query keys after mutations.

## Commands
`npm install`, `npm run dev` (port 3000), `npm run build`, `npm start`, `npm run lint`, `npm run prettier`. Secrets (`AUTH_SECRET`, `ITCHI_ENCRYPTION_KEY`, Ably key) and service URLs only from env.
