import JobPage from '@/components/jobs/JobPage'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <JobPage id={id} />
}
