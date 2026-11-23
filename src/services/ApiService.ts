import axios, { type AxiosInstance } from 'axios'
import { getServiceBaseUrl, type ServiceName } from '@/configs/services.config'

const instances = new Map<ServiceName, AxiosInstance>()

// One axios instance per backend service. Token and refresh handling are added in AxiosProvider.
export function api(service: ServiceName): AxiosInstance {
    let instance = instances.get(service)
    if (!instance) {
        instance = axios.create({ baseURL: getServiceBaseUrl(service), timeout: 50000 })
        instances.set(service, instance)
    }
    return instance
}
