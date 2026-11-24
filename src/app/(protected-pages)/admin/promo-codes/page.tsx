import { redirect } from 'next/navigation'

// The promo codes live on the plans page.
export default function Page() {
    redirect('/admin/plans#codes')
}
