import CvCheck from '@/components/resume/check/CvCheck'

// Screen 4.2: the 24 CV rules, what to fix and a proposal for each.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <CvCheck id={id} />
}
