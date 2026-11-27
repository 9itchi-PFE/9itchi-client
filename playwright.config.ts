import { defineConfig } from '@playwright/test'

// Journeys through the real pages, in a real browser, with the services answered by e2e/services.ts and the
// server-side sign-in by e2e/mock-account.mjs. Locally the dev server is used; CI builds with these values and
// starts the built client.
const PORT = 3101
const baseURL = `http://localhost:${PORT}`
const CI = !!process.env.CI

const service = (name: string) => `http://e2e.test/${name}`
export const e2eEnv = {
    NEXT_PUBLIC_USE_PROXY: 'false',
    NEXT_PUBLIC_ACCOUNT_API_BASE_URL: 'http://localhost:3201',
    NEXT_PUBLIC_RESUME_API_BASE_URL: service('resume'),
    NEXT_PUBLIC_AI_API_BASE_URL: service('ai'),
    NEXT_PUBLIC_JOB_API_BASE_URL: service('job'),
    NEXT_PUBLIC_EMAIL_API_BASE_URL: service('email'),
    NEXT_PUBLIC_TRACKER_API_BASE_URL: service('tracker'),
    NEXT_PUBLIC_NOTIFICATION_API_BASE_URL: service('notification'),
    NEXT_PUBLIC_CHAT_API_BASE_URL: service('chat'),
    NEXT_PUBLIC_PAYMENTS_API_BASE_URL: service('payments'),
    NEXT_PUBLIC_STATISTICS_API_BASE_URL: service('statistics'),
    NEXT_PUBLIC_SCHEDULE_API_BASE_URL: service('schedule'),
    // Test values only: they sign the session cookie of a local test run.
    AUTH_SECRET: 'e2e-only-not-a-secret-0123456789abcdef',
    AUTH_TRUST_HOST: 'true',
    NEXTAUTH_URL: baseURL,
    // What the Next server itself reads of job-api (shared offers' metadata, the sitemap), answered by mock-account.mjs.
    JOB_API_URL: 'http://localhost:3201/job',
    NEXT_TELEMETRY_DISABLED: '1',
}

export default defineConfig({
    testDir: 'e2e',
    timeout: 60_000,
    expect: { timeout: 15_000 },
    retries: CI ? 1 : 0,
    workers: 1,
    reporter: CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL,
        locale: 'fr-FR',
        timezoneId: 'Africa/Tunis',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        // A Chrome already on the machine, when Playwright's own cannot be downloaded.
        launchOptions: process.env.PW_CHROME_PATH ? { executablePath: process.env.PW_CHROME_PATH } : {},
    },
    webServer: [
        { command: 'node e2e/mock-account.mjs', url: 'http://localhost:3201/health', reuseExistingServer: !CI },
        {
            // The NEXT_PUBLIC_ values are read when the client is built, so CI builds with them here.
            command: CI ? `npx next build && npx next start -p ${PORT}` : `npx next dev -p ${PORT}`,
            url: `${baseURL}/auth/signin`,
            env: e2eEnv,
            timeout: 600_000,
            reuseExistingServer: !CI,
        },
    ],
})
