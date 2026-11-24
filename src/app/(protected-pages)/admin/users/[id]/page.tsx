import StudentScreen from '@/components/admin/StudentScreen'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <StudentScreen id={id} />
}
