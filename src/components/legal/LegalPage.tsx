import Link from 'next/link'
import type { ReactNode } from 'react'

export const LEGAL = {
    app: '9itchi',
    site: 'https://9itchi-pfe.com',
    company: 'Lakhal Technologies',
    address: 'Rue Liberté aéroport, Sfax, Tunisie',
    email: 'contact@9itchi-pfe.com',
    updated: 'November 27, 2026',
}

export type LegalSection = { title: string; body: ReactNode }

export function LegalList({ items }: { items: ReactNode[] }) {
    return (
        <ul className="mt-2 list-disc space-y-1 pl-6">
            {items.map((item, i) => (
                <li key={i}>{item}</li>
            ))}
        </ul>
    )
}

export default function LegalPage({ title, intro, sections }: { title: string; intro: ReactNode; sections: LegalSection[] }) {
    return (
        <main className="mx-auto max-w-3xl px-6 py-12 text-sm leading-relaxed text-gray-700">
            <Link href="/" className="text-xs underline">
                ← Back to {LEGAL.app}
            </Link>
            <h1 className="mt-4 text-3xl font-semibold text-gray-900">{title}</h1>
            <p className="mt-1 text-xs text-gray-500">Last updated: {LEGAL.updated}</p>
            <p className="mt-6">{intro}</p>
            {sections.map((s, i) => (
                <section key={s.title} className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {i + 1}. {s.title}
                    </h2>
                    <div className="mt-2 space-y-2">{s.body}</div>
                </section>
            ))}
            <footer id="legal-notice" className="mt-12 scroll-mt-6 border-t pt-6 text-xs text-gray-500">
                <p className="font-semibold text-gray-700">Legal notice (Mentions légales)</p>
                <p>Trade name: {LEGAL.company}</p>
                <p>Registered office: {LEGAL.address}</p>
                <p>
                    Contact:{' '}
                    <a href={`mailto:${LEGAL.email}`} className="underline">
                        {LEGAL.email}
                    </a>
                </p>
                <p className="mt-3">
                    <Link href="/terms-conditions" className="underline">
                        Terms and Conditions
                    </Link>
                    {' · '}
                    <Link href="/privacy-policy" className="underline">
                        Privacy Policy
                    </Link>
                    {' · '}
                    <Link href="/cookies" className="underline">
                        Cookie Policy
                    </Link>
                </p>
            </footer>
        </main>
    )
}
