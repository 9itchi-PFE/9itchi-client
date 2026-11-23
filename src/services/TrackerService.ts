import { api } from './ApiService'

const TrackerService = {
    emailStats: (id: string) => api('tracker').get(`/emails/${id}/stats`),
}

export default TrackerService
