import { redirect } from 'next/navigation'

// There is no dashboard: a student starts on the offers.
export default function Page() {
    redirect('/jobs')
}
