import type { Metadata } from 'next'
import LegalPage, { LEGAL, LegalList } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: 'Cookie Policy' }

// The cookies 9itchi sets, all strictly necessary: no advertising, analytics or cross-site tracking cookie, so no
// consent banner. Keep this list in step with the code (Auth.js cookies, NEXT_LOCALE in LanguageSelect).
const COOKIES: [string, string, string][] = [
    ['__Secure-authjs.session-token', 'Keeps you signed in (an encrypted session).', 'Until you sign out, 30 days at most'],
    ['__Host-authjs.csrf-token', 'Protects sign-in forms against cross-site request forgery.', 'Session'],
    ['__Secure-authjs.callback-url', 'Brings you back to the page you were on after signing in.', 'Session'],
    ['google_oauth_state, linkedin_oauth_state', 'Secure signing in with Google or LinkedIn while it happens.', '10 minutes'],
    ['NEXT_LOCALE', 'Remembers the language you chose.', '1 year'],
]

export default function Page() {
    return (
        <LegalPage
            title="Cookie Policy"
            intro={`${LEGAL.app} (${LEGAL.site}) uses only the cookies it needs to work: to keep you signed in, to protect sign-in, and to remember your language. We use no advertising, analytics or cross-site tracking cookies, which is why we do not ask for your consent with a banner.`}
            sections={[
                {
                    title: 'The cookies we set',
                    body: (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-2 pr-4 font-semibold text-gray-900">Name</th>
                                        <th className="py-2 pr-4 font-semibold text-gray-900">Purpose</th>
                                        <th className="py-2 font-semibold text-gray-900">Kept for</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {COOKIES.map(([name, purpose, kept]) => (
                                        <tr key={name} className="border-b align-top">
                                            <td className="py-2 pr-4 font-mono text-xs" dir="ltr">
                                                {name}
                                            </td>
                                            <td className="py-2 pr-4">{purpose}</td>
                                            <td className="py-2">{kept}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ),
                },
                {
                    title: 'Other storage in your browser',
                    body: (
                        <LegalList
                            items={[
                                'Session storage keeps small state between two steps of a page (for example returning to the outreach page after connecting Gmail). It is cleared when you close the tab.',
                                'Emails sent through 9itchi may contain a small image that tells you when the email is opened. It sets no cookie in your recipient’s browser.',
                            ]}
                        />
                    ),
                },
                {
                    title: 'Your choices',
                    body: (
                        <p>
                            You can delete or block cookies in your browser settings. If you block the sign-in cookies you will not be able to stay signed in to{' '}
                            {LEGAL.app}. For any question write to{' '}
                            <a href={`mailto:${LEGAL.email}`} className="underline">
                                {LEGAL.email}
                            </a>
                            .
                        </p>
                    ),
                },
            ]}
        />
    )
}
