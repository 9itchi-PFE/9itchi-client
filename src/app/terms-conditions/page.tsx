/* eslint-disable react/no-unescaped-entities -- long-form legal copy */
import type { Metadata } from 'next'
import LegalPage, { LEGAL, LegalList } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: `Terms and Conditions | ${LEGAL.app}` }

const link = (href: string, label: string) => (
    <a href={href} className="underline" target="_blank" rel="noreferrer">
        {label}
    </a>
)

export default function Page() {
    return (
        <LegalPage
            title="Terms and Conditions"
            intro={`These Terms govern your use of ${LEGAL.app} (${LEGAL.site}), operated by ${LEGAL.company} ("we", "us"). By creating an account or using the service, including through Google or LinkedIn sign-in, you agree to these Terms. If you do not agree, do not use the service.`}
            sections={[
                {
                    title: 'The service',
                    body: (
                        <>
                            <p>
                                {LEGAL.app} is a platform to build and improve resumes, check them against applicant-tracking systems (ATS), discover job
                                opportunities, and prepare and send job applications by email.
                            </p>
                            <LegalList
                                items={[
                                    'Resume tools: upload, parse, edit, template and export your resume as PDF.',
                                    'AI features: rewriting suggestions, ATS scoring, resume-to-job matching and email drafting.',
                                    'Opportunities board: job offers collected from public third-party sources.',
                                    'Applications: sending emails from your own Gmail account, immediately or scheduled, with delivery and open statistics.',
                                ]}
                            />
                        </>
                    ),
                },
                {
                    title: 'Eligibility and accounts',
                    body: (
                        <LegalList
                            items={[
                                'You must be at least 18 years old, or the age of majority in your country, and able to enter a binding contract.',
                                'Provide accurate and current information and keep it up to date.',
                                'You are responsible for your credentials and for all activity under your account. Tell us immediately if you suspect unauthorized access.',
                                'One person, one account. Accounts may not be sold, shared or transferred.',
                            ]}
                        />
                    ),
                },
                {
                    title: 'Your content',
                    body: (
                        <>
                            <p>
                                Your resumes, profile data and messages remain yours. You grant us a limited, worldwide, non-exclusive licence to host, process
                                and display them only to operate and improve the service for you, including sending them to the processors listed in our Privacy
                                Policy.
                            </p>
                            <p>
                                You confirm that you have the right to submit your content, that it is truthful, and that it does not infringe the rights of
                                others or contain data about third parties you have no right to share.
                            </p>
                        </>
                    ),
                },
                {
                    title: 'Google, Gmail and third-party sign-in',
                    body: (
                        <>
                            <LegalList
                                items={[
                                    'Google and LinkedIn sign-in are used only to identify you (name and verified email).',
                                    'Gmail sending is a separate, optional authorization described in the next section.',
                                ]}
                            />
                            <p>
                                Our use of data received from Google APIs follows the{' '}
                                {link('https://developers.google.com/terms/api-services-user-data-policy', 'Google API Services User Data Policy')}, including
                                the Limited Use requirements.
                            </p>
                        </>
                    ),
                },
                {
                    title: 'Authorization to send emails on your behalf',
                    body: (
                        <>
                            <p>
                                Sending applications from your Gmail address is an optional feature that is off by default. It is activated only when you choose
                                "Connect Gmail" in Settings and approve Google's consent screen. Signing in with Google alone does not grant it.
                            </p>
                            <p>By connecting Gmail you expressly authorize {LEGAL.company} to:</p>
                            <LegalList
                                items={[
                                    'send, from your Gmail address and in your name, the emails you create or approve in the app, including applications and follow-ups to recruiters and employers you select;',
                                    'send them at the time you choose, including scheduled emails sent later without you being signed in;',
                                    'attach the resume and documents you select, and include a tracking image to report opens to you.',
                                ]}
                            />
                            <p>You acknowledge that:</p>
                            <LegalList
                                items={[
                                    'we only send what you have composed or approved, to recipients you chose; we never send emails you have not requested and never contact recruiters on our own initiative;',
                                    'the permission is send-only: we cannot read, search or delete your mailbox, and sent messages appear in your Gmail "Sent" folder;',
                                    'you are the sender and are solely responsible for the content, accuracy, recipients and lawfulness of each email, including anti-spam and data-protection rules; AI-drafted text must be reviewed by you before sending;',
                                    'we apply daily sending limits and may pause sending to protect your Gmail account, recipients and the service; Google may also apply its own limits;',
                                    'you can withdraw this authorization at any time by choosing "Disconnect" in Settings or by revoking access in your Google Account; pending scheduled emails are then not sent, and emails already sent cannot be recalled.',
                                ]}
                            />
                        </>
                    ),
                },
                {
                    title: 'Acceptable use',
                    body: (
                        <>
                            <p>You must not:</p>
                            <LegalList
                                items={[
                                    'use the service for spam, bulk unsolicited email, phishing, harassment or any unlawful, misleading or fraudulent purpose;',
                                    'submit false, forged or deceptive resume information or impersonate another person;',
                                    'scrape, crawl, reverse engineer, overload or attempt to bypass the security or rate limits of the service;',
                                    'upload malware or content that is illegal, hateful or infringes intellectual property or privacy rights;',
                                    'resell or provide the service to third parties without our written consent.',
                                ]}
                            />
                            <p>We may limit sending volumes and suspend accounts to protect users, recipients and the reputation of the service.</p>
                        </>
                    ),
                },
                {
                    title: 'AI-generated content',
                    body: (
                        <>
                            <p>
                                Rewrites, scores, matches and drafts are produced by automated models and may be inaccurate, incomplete or unsuitable. They are
                                suggestions only.
                            </p>
                            <p>
                                You must review everything before using or sending it. ATS scores and match results are indicative and do not guarantee
                                interviews, offers or how any employer's system will treat your resume.
                            </p>
                        </>
                    ),
                },
                {
                    title: 'Job opportunities and third parties',
                    body: (
                        <p>
                            Job offers come from third-party sources. We do not employ, endorse or verify employers or recruiters, and we are not a party to any
                            application, interview or employment relationship. Verify any offer before sharing sensitive information. Links and services of
                            third parties are governed by their own terms.
                        </p>
                    ),
                },
                {
                    title: 'Plans, payments and promo codes',
                    body: (
                        <LegalList
                            items={[
                                'Some features require a paid plan or have usage limits. Prices and limits are shown in the app before you pay.',
                                'Payments are handled by third-party payment providers; we do not store your card details.',
                                'Promo codes are single-purpose, may expire and cannot be exchanged for cash.',
                                'Refund within 7 days: a payment is refunded in full when you ask within 7 days of paying and, since that payment, you have downloaded no resume and sent no application with the resume built in the service.',
                                'A payment taken twice, or taken without your plan being activated, is always refunded.',
                                'Otherwise payments are not refunded, in whole or in part. If you stop your plan you keep access until the end of the period you paid for; if you delete your account, the rest of the period is given up.',
                                'To ask for a refund, write to us from the Help page. Where mandatory consumer law gives you a wider withdrawal or refund right, it is not affected.',
                            ]}
                        />
                    ),
                },
                {
                    title: 'Intellectual property',
                    body: (
                        <p>
                            The service, its software, design, templates, brand and documentation belong to {LEGAL.company} or its licensors. We grant you a
                            limited, revocable, non-exclusive, non-transferable licence to use the service for your personal job search. All rights not
                            expressly granted are reserved.
                        </p>
                    ),
                },
                {
                    title: 'Availability and changes to the service',
                    body: (
                        <p>
                            We aim for reliable service but do not guarantee uninterrupted or error-free operation. We may modify, suspend or discontinue
                            features, for maintenance, security, legal or business reasons, with notice where reasonably possible.
                        </p>
                    ),
                },
                {
                    title: 'Disclaimer of warranties',
                    body: (
                        <p>
                            The service is provided "as is" and "as available", without warranties of any kind, express or implied, including merchantability,
                            fitness for a particular purpose, accuracy and non-infringement, to the maximum extent permitted by law.
                        </p>
                    ),
                },
                {
                    title: 'Limitation of liability',
                    body: (
                        <>
                            <p>
                                To the maximum extent permitted by law, {LEGAL.company} is not liable for indirect, incidental, special or consequential
                                damages, or for loss of profits, data, opportunities or employment, arising from your use of the service, from AI output, from
                                emails you send, or from third-party offers and services.
                            </p>
                            <p>
                                Our total liability for any claim is limited to the amount you paid us in the 12 months before the claim, or 100 TND if you paid
                                nothing. Nothing excludes liability that cannot be excluded by law.
                            </p>
                        </>
                    ),
                },
                {
                    title: 'Indemnity',
                    body: (
                        <p>
                            You agree to indemnify and hold us harmless from claims, damages and costs (including reasonable legal fees) arising from your
                            content, the emails you send through the service, or your breach of these Terms or applicable law.
                        </p>
                    ),
                },
                {
                    title: 'Suspension and termination',
                    body: (
                        <p>
                            You may stop using the service and delete your account at any time. We may suspend or terminate access immediately if you breach
                            these Terms, put others or the service at risk, or if required by law. On termination your right to use the service ends; clauses
                            that by nature survive (intellectual property, disclaimers, liability, governing law) continue to apply.
                        </p>
                    ),
                },
                {
                    title: 'Privacy',
                    body: (
                        <p>
                            Our processing of personal data is described in the{' '}
                            <a href="/privacy-policy" className="underline">
                                Privacy Policy
                            </a>
                            , which forms part of these Terms.
                        </p>
                    ),
                },
                {
                    title: 'Governing law and disputes',
                    body: (
                        <p>
                            These Terms are governed by the laws of Tunisia. Before any proceeding, the parties will try to resolve a dispute amicably by
                            contacting us. Failing that, the competent courts of Sfax, Tunisia have jurisdiction, without prejudice to mandatory
                            consumer-protection rules of your country of residence.
                        </p>
                    ),
                },
                {
                    title: 'Changes to these Terms',
                    body: (
                        <p>
                            We may update these Terms. The updated version is posted on this page with a new date, and for material changes we will notify you
                            in the app or by email. Continuing to use the service after the effective date means you accept the new Terms.
                        </p>
                    ),
                },
                {
                    title: 'Contact',
                    body: (
                        <p>
                            Questions about these Terms:{' '}
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
