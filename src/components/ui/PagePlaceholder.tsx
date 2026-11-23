export default function PagePlaceholder({ title, description }: { title: string; description?: string }) {
    return (
        <section className="p-6">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {description ? <p className="mt-2 text-gray-600">{description}</p> : null}
        </section>
    )
}
