import axios, { type AxiosInstance } from 'axios'
import { getServiceBaseUrl, type ServiceName } from '@/configs/services.config'

const instances = new Map<ServiceName, AxiosInstance>()

// The service token (AES-GCM encrypted JWT from account-api), set by AxiosProvider from the session.
let authToken: string | undefined
export const setAuthToken = (token: string | undefined) => {
    authToken = token
}

// One axios instance per backend service, each sending Authorization: Bearer {token}.
export function api(service: ServiceName): AxiosInstance {
    let instance = instances.get(service)
    if (!instance) {
        instance = axios.create({ baseURL: getServiceBaseUrl(service), timeout: 50000 })
        instance.interceptors.request.use((config) => {
            if (authToken) config.headers.set('Authorization', `Bearer ${authToken}`)
            return config
        })
        instances.set(service, instance)
    }
    return instance
}

// errorMessage reads the backend's {"error": "..."} body.
export function errorStatus(err: unknown): number | undefined {
    return axios.isAxiosError(err) ? err.response?.status : undefined
}
