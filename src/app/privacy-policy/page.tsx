/* eslint-disable react/no-unescaped-entities -- long-form legal copy */
import type { Metadata } from 'next'
import LegalPage, { LEGAL, LegalList } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: `Privacy Policy | ${LEGAL.app}` }

const link = (href: string, label: string) => (
    <a href={href} className="underline" target="_blank" rel="noreferrer">
        {label}
    </a>
)

export default function Page() {
    return (
        <LegalPage
            title="Privacy Policy"
            intro={`${LEGAL.company} ("we", "us") operates ${LEGAL.app} (${LEGAL.site}) and is the controller of your personal data. This policy explains what we collect, why, who receives it and the rights you have. It follows the GDPR principles and Tunisian Law No. 2004-63 on the protection of personal data.`}
            sections={[
                {
                    title: 'Data we collect',
                    body: (
                        <LegalList
                            items={[
                                'Account data: name, email address, password (stored only as a salted hash), role, language and account status. With Google or LinkedIn sign-in we receive your name and verified email address only.',
                                'Resume data: the files you upload (PDF), the parsed and edited content (experience, education, skills, contact details, photo if you add one) and the versions you save.',
                                'Job preferences: target roles, locations and similar settings, plus the offers you save, hide or apply to.',
                                'Application data: emails you compose, recipients, attachments, schedule, delivery status and open events.',
                                'Gmail connection (optional): an access token we store encrypted, granting send-only permission. We do not read your mailbox.',
                                'Payments: plan, subscription status, promo codes and payment references. Card details are handled by the payment provider and never reach us.',
                                'Support chat: messages you send to our support team.',
                                'Technical data: IP address, browser, device, timestamps and error logs, and session cookies needed to keep you signed in.',
                            ]}
                        />
                    ),
                },
                {
                    title: 'Why we use it, and our legal basis',
                    body: (
                        <LegalList
                            items={[
                                'Provide the service you requested: accounts, resume tools, AI features, job board, sending applications (contract).',
                                'Send service messages: password reset, in-app and email notifications about your applications (contract, legitimate interest).',
                                'Process payments and prevent fraud and abuse (contract, legitimate interest, legal obligation).',
                                'Secure, debug and improve the service, and compute aggregated statistics (legitimate interest).',
                                'Comply with the law and answer legal requests (legal obligation).',
                                'Optional features you switch on, such as the Gmail connection (consent, which you can withdraw at any time).',
                            ]}
                        />
                    ),
                },
                {
                    title: 'Google user data (Gmail and sign-in)',
                    body: (
                        <>
                            <LegalList
                                items={[
                                    'We request the Gmail send-only permission solely to send, on your instruction, the application emails you create, now or at the time you schedule.',
                                    'We cannot read, search, list, modify or delete your emails or contacts.',
                                    'Tokens are stored encrypted (AES-GCM) and used only for the feature above. You can disconnect in the app or revoke access at myaccount.google.com/permissions; stored tokens are then deleted or become unusable.',
                                    'We do not use Google user data for advertising, do not sell it, and do not transfer it to others except as needed to provide the feature, to comply with law, or with your consent.',
                                    'Humans do not read Google user data unless you ask for support, it is necessary for security or abuse investigation, or the law requires it.',
                                ]}
                            />
                            <p>
                                The use and transfer of information received from Google APIs to any other app adheres to the{' '}
                                {link('https://developers.google.com/terms/api-services-user-data-policy', 'Google API Services User Data Policy')}, including
                                the Limited Use requirements.
                            </p>
                        </>
                    ),
                },
                {
                    title: 'AI processing',
                    body: (
                        <>
                            <p>
                                To parse, score, rewrite or match your resume, and to draft emails, the relevant text is sent to third-party AI providers
                                (currently Google Gemini and OpenAI, and LlamaCloud for document parsing) under their API terms. We send only what is needed for
                                the request.
                            </p>
                            <p>
                                We do not use your resume content to train our own models, and we do not take decisions with legal effect about you based solely
                                on automated processing; results are suggestions you review.
                            </p>
                        </>
                    ),
                },
                {
                    title: 'Email open tracking',
                    body: (
                        <p>
                            Application emails you send may contain a small tracking image that tells you whether and when a recipient opened them. This is
                            shown in your statistics. Recipients' email clients may block it, so the data is indicative only. You are responsible for informing
                            recipients where the law requires it.
                        </p>
                    ),
                },
                {
                    title: 'Who receives your data',
                    body: (
                        <>
                            <p>We share data only with service providers acting for us, bound by contract:</p>
                            <LegalList
                                items={[
                                    'Hosting and network security: our server infrastructure and Cloudflare (traffic proxying).',
                                    'Email delivery: Mailgun (transactional email) and Google (Gmail sending you authorize).',
                                    'AI and document parsing: Google, OpenAI, LlamaCloud.',
                                    'Real-time notifications and chat: Ably.',
                                    'Payments: our payment providers (e.g. Flouci).',
                                    'Authorities, when legally required.',
                                ]}
                            />
                            <p>When you send an application, the recipient you choose receives your email and attachments. We never sell your personal data.</p>
                        </>
                    ),
                },
                {
                    title: 'International transfers',
                    body: (
                        <p>
                            Some providers are located outside Tunisia and the EEA. Where required, transfers rely on appropriate safeguards such as standard
                            contractual clauses or an adequacy decision.
                        </p>
                    ),
                },
                {
                    title: 'Retention',
                    body: (
                        <LegalList
                            items={[
                                'Account, resume and application data are kept while your account is active.',
                                'When you delete your account we delete or anonymize your data within 30 days, except what we must keep for legal, accounting or fraud-prevention reasons (for example payment records).',
                                'Backups and logs are overwritten on a rolling basis, typically within 90 days.',
                                'Inactive accounts may be deleted after a prolonged period, with prior notice.',
                            ]}
                        />
                    ),
                },
                {
                    title: 'Security',
                    body: (
                        <p>
                            We use encryption in transit (HTTPS), hashed passwords, encrypted storage of Gmail tokens, access controls, rate limiting and
                            separation of services. No system is perfectly secure; if a breach affecting your rights occurs we will notify you and the competent
                            authority as required by law.
                        </p>
                    ),
                },
                {
                    title: 'Cookies',
                    body: (
                        <p>
                            We use only strictly necessary cookies: authentication session and security (CSRF, OAuth state) cookies, and one that remembers your
                            language. We do not use advertising or cross-site tracking cookies. The full list is in our{' '}
                            <a href="/cookies" className="underline">
                                Cookie Policy
                            </a>
                            .
                        </p>
                    ),
                },
                {
                    title: 'Your rights',
                    body: (
                        <>
                            <p>
                                You can request access, correction, deletion, restriction, portability, and object to certain processing, and withdraw consent
                                at any time. You can edit most data and delete your account in the app. For other requests write to{' '}
                                <a href={`mailto:${LEGAL.email}`} className="underline">
                                    {LEGAL.email}
                                </a>
                                ; we answer within 30 days and may need to verify your identity.
                            </p>
                            <p>You may also complain to the Tunisian data protection authority (INPDP) or to your local supervisory authority.</p>
                        </>
                    ),
                },
                {
                    title: 'Children',
                    body: (
                        <p>
                            The service is not intended for people under 18. If we learn that we hold data of a minor without valid authorization, we delete it.
                        </p>
                    ),
                },
                {
                    title: 'Changes to this policy',
                    body: <p>We may update this policy and will post the new date here; for material changes we will notify you in the app or by email.</p>,
                },
                {
                    title: 'Contact',
                    body: (
                        <p>
                            {LEGAL.company}, {LEGAL.address}. Email:{' '}
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
