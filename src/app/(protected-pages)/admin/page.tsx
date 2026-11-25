import { redirect } from 'next/navigation'

// The team starts on the figures until the overview of the canvas is built.
export default function Page() {
    redirect('/admin/stats')
}
