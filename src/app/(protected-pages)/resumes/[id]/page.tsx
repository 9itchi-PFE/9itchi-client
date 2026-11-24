import CvEditor from '@/components/resume/editor/CvEditor'

// Screen 4.1 Mon CV: sections, live checks, A4 preview, versions and downloads.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <CvEditor id={id} />
}
