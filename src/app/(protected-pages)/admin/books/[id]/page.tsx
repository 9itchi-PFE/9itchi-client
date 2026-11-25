import BookCheckScreen from '@/components/admin/BookCheckScreen'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <BookCheckScreen id={id} />
}
