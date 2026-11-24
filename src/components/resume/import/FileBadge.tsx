// FileBadge is the small coloured file icon of the import screens (PDF, DOCX, JPG).
export default function FileBadge({ name }: { name: string }) {
    const ext = (name.split('.').pop() ?? '').toUpperCase().replace('JPEG', 'JPG')
    const word = ext === 'DOCX' || ext === 'DOC'
    return (
        <span
            aria-hidden
            className="flex h-12 w-10 flex-none items-center justify-center rounded text-[11px] font-bold"
            style={{ background: word ? '#DCE8FF' : '#FEE4E2', color: word ? '#1849A9' : '#B42318' }}
        >
            {ext || 'CV'}
        </span>
    )
}
