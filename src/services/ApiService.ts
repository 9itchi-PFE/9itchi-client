import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { getServiceBaseUrl, type ServiceName } from '@/configs/services.config'

const instances = new Map<ServiceName, AxiosInstance>()

// The service token (AES-GCM encrypted JWT from account-api), set by AxiosProvider from the session.
let authToken: string | undefined
export const setAuthToken = (token: string | undefined) => {
    authToken = token
}

// Calls made while the session is still loading wait for it (at most a few seconds), so a page opened
// directly does not send its first requests without a token.
let markReady: () => void = () => {}
let ready = new Promise<void>((r) => (markReady = r))
export const setSessionReady = (isReady: boolean) => {
    if (isReady) markReady()
    else ready = new Promise<void>((r) => (markReady = r))
}
const waitForSession = () => Promise.race([ready, new Promise<void>((r) => setTimeout(r, 5000))])

// renewToken asks the session for a new token after a 401; one renewal is shared by concurrent calls.
let renewToken: (() => Promise<string | undefined>) | undefined
let renewing: Promise<string | undefined> | undefined
export const setTokenRenewer = (fn: (() => Promise<string | undefined>) | undefined) => {
    renewToken = fn
}
function renewOnce() {
    if (!renewToken) return Promise.resolve(undefined)
    renewing ??= renewToken().finally(() => {
        renewing = undefined
    })
    return renewing
}

// One axios instance per backend service, each sending Authorization: Bearer {token}, retrying once after a 401.
export function api(service: ServiceName): AxiosInstance {
    let instance = instances.get(service)
    if (!instance) {
        instance = axios.create({ baseURL: getServiceBaseUrl(service), timeout: 50000 })
        instance.interceptors.request.use(async (config) => {
            if (!authToken && typeof window !== 'undefined') await waitForSession()
            if (authToken) config.headers.set('Authorization', `Bearer ${authToken}`)
            ;(config as InternalAxiosRequestConfig & { _sentToken?: string })._sentToken = authToken
            return config
        })
        const self = instance
        instance.interceptors.response.use(undefined, async (err) => {
            const config = err?.config as (InternalAxiosRequestConfig & { _retried?: boolean; _sentToken?: string }) | undefined
            if (!axios.isAxiosError(err) || err.response?.status !== 401 || !config || config._retried || !authToken) throw err
            config._retried = true
            // Sent before the session arrived: retry with the current token, no renewal needed.
            const token = config._sentToken && config._sentToken === authToken ? await renewOnce() : authToken
            if (!token) throw err
            authToken = token
            config.headers.set('Authorization', `Bearer ${token}`)
            return self(config)
        })
        instances.set(service, instance)
    }
    return instance
}

// errorMessage reads the backend's {"error": "..."} body.
export function errorStatus(err: unknown): number | undefined {
    return axios.isAxiosError(err) ? err.response?.status : undefined
}
