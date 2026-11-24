# 9itchi-client

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind frontend for 9itchi.

```
cp .env.example .env.local
npm install
npm run dev
```

`npm run lint`, `npm test` (vitest), `npm run build`, `npm run prettier`.

## What is built

The CV screens of sprint 2 follow the canvas design (fonts, colours, spacing and copy):

| Route | Screen |
|---|---|
| `/resumes/upload` | 1.2 import, 1.2b reading, 1.2c what was found, and the import error card |
| `/resumes` | opens the CV edited last, or the import |
| `/resumes/[id]` | 4.1 Mon CV: sections, live line checks, A4 preview, versions drawer, download dialogs |
| `/resumes/[id]/check` | 4.2 the 24 CV rules with proposals |
| `/resumes/templates?cv=` | 4.3 template picker |

Other pages are still placeholders. Students get the header of the canvas (pill nav, language, notifications, account menu); admins keep the sidebar.

## Design tokens

`tailwind.config.ts` holds the canvas colours (`ink`, `lime`, `violet`, `ember`, `page`, `line`, `ok`, `warn`, `cv`), fonts (`font-display` Bricolage Grotesque, `font-sans` Inter, `font-mono` JetBrains Mono, `font-cv` Source Sans 3, `font-cvserif` Source Serif 4, Noto Sans Arabic as fallback) and the hard card shadow (`shadow-card`, `shadow-pop`). Fonts are self-hosted from `@fontsource-variable`. Shared pieces live in `src/components/ui` (Button, Modal/Drawer, Toast, Field, Segmented, icons, Logo).

## Languages

next-intl without locale in the URL: `fr` (default), `en`, `ar` (right to left). The language menu writes the `NEXT_LOCALE` cookie; `src/i18n/request.ts` falls back to the browser's language. Messages are in `messages/{fr,en,ar}.json`; a test checks the three files have the same keys. Text printed on the CV (section titles) follows the CV's language, not the interface's.

## Auth

`AxiosProvider` sends `Authorization: Bearer {token}` from the session's `accessToken` and shares the user through `SessionContext`. The NextAuth providers that fill the session are not wired yet.
