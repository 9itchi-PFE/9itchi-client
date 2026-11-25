import { redirect } from 'next/navigation'

// An application is written from its offer (« Postuler »); this old address leads to the applications.
export default function Page() {
    redirect('/applications')
}
