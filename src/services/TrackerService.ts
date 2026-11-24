import type { EmailStats } from '@/types/application'
import { api } from './ApiService'

const TrackerService = {
    emailStats: (id: string) => api('tracker').get<EmailStats>(`/emails/${id}/stats`),
}

export default TrackerService
