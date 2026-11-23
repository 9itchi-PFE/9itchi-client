export type Notification = {
    id: string
    type: string
    title: string
    data: Record<string, unknown>
    read: boolean
}
