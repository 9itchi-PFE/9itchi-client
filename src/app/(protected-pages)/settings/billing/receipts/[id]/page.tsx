import ReceiptScreen from '@/components/billing/ReceiptScreen'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ReceiptScreen id={id} />
}
