export type Resume = {
    id: string
    title: string
    content: Record<string, unknown>
    template_id: string
    version: number
    file_url?: string
}

export type Template = { id: string; name: string; layout: string; preview_url: string }
