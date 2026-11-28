'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/Button'
import { inputClass, TextArea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/icons'
import { Segmented } from '@/components/ui/Segmented'
import { Select } from '@/components/ui/Select'
import { useLinkDraft } from '@/hooks/useRecruiters'
import { useResumes } from '@/hooks/useResumes'
import { cn } from '@/lib/cn'
import { quotaReason } from '@/utils/quota'
import type { LetterLanguage, Tone } from '@/types/application'
import type { LinkDraft } from '@/types/recruiter'
import CompanyRecruiters from './CompanyRecruiters'
import EmailComposer, { type DraftAsk } from './EmailComposer'
import GmailCard from './GmailCard'
import Paywall from './Paywall'
import { bookmarklet, linkSource, OFFER_TEXT_MAX, offerFromHash, offerLink } from './outreach'

const label = 'flex min-w-0 flex-col gap-1.5 text-[13.5px] font-medium text-ink-2'

// LinkScreen writes an application email from the link of an offer (a 9itchi offer, a company's career page). A
// page that cannot be read (LinkedIn among them) asks for the offer's text instead; the « Send to 9itchi » bookmark
// brings the link and the text from the student's own browser (after #, read once then cleared).
export default function LinkScreen() {
    const t = useTranslations('outreach.link')
    const locale = useLocale()
    const resumes = useResumes()
    const draft = useLinkDraft()
    const [url, setUrl] = useState('')
    const [text, setText] = useState('')
    const [needText, setNeedText] = useState(false)
    const [resumeId, setResumeId] = useState<string | null>(null)
    const [language, setLanguage] = useState<LetterLanguage>(locale === 'en' || locale === 'ar' ? locale : 'fr')
    const [tone, setTone] = useState<Tone>('formal')
    const [result, setResult] = useState<{ draft: LinkDraft; url: string; text: string } | null>(null)
    const [to, setTo] = useState('')
    const [appHost, setAppHost] = useState<string | undefined>()
    const button = useRef<HTMLAnchorElement>(null)
    useEffect(() => {
        setAppHost(window.location.hostname)
        // React refuses javascript: links in JSX: the bookmark's link is set on the element.
        button.current?.setAttribute('href', bookmarklet(window.location.origin))
        const sent = offerFromHash(window.location.hash)
        if (!sent) return
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        setUrl(sent.url)
        if (sent.text) {
            setText(sent.text)
            setNeedText(true)
        }
    }, [])

    const resumeList = resumes.data?.items ?? []
    const resume = resumeId ?? resumeList[0]?.id ?? ''
    const source = linkSource(url, appHost)
    const blocked = quotaReason(draft.error)
    const status = isAxiosError(draft.error) ? draft.error.response?.status : undefined
    // LinkedIn is never read: its text is asked at once.
    const askText = needText || source === 'linkedin'
    const ready = !!source && (!askText || text.trim().length >= 40)

    const ask = (a: Pick<DraftAsk, 'language' | 'tone' | 'fresh' | 'resume_id'>, link: string, offerText: string) =>
        draft.mutateAsync({ url: link, offer_text: offerText || undefined, resume_id: a.resume_id, language: a.language, tone: a.tone, fresh: a.fresh })

    const submit = async () => {
        if (!ready) return
        const link = offerLink(url)
        const offerText = askText ? text.trim() : ''
        try {
            const d = await ask({ language, tone, fresh: false, resume_id: resume || undefined }, link, offerText)
            setResult({ draft: d, url: link, text: offerText })
        } catch (e) {
            if (isAxiosError(e) && e.response?.status === 422) setNeedText(true)
        }
    }

    const sourceChip = source ? (
        <span
            className={cn(
                'inline-flex h-7 items-center gap-1.5 self-start rounded-full px-2.5 text-[12.5px] font-semibold',
                source === '9itchi' ? 'bg-ink text-lime' : source === 'linkedin' ? 'bg-violet-soft text-violet' : 'bg-fill text-ink-2',
            )}
        >
            <Icon name="link" size={13} /> {t(`source.${source}`)}
        </span>
    ) : null

    return (
        <main className="mx-auto box-border flex w-full max-w-[880px] flex-1 flex-col gap-5 px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
            <div className="flex flex-col gap-1.5">
                <h1 className="m-0 font-display text-[28px] font-extrabold leading-[1.05] sm:text-[38px]">{t('title')}</h1>
                <p className="m-0 text-[15px] text-ink-3">{t('intro')}</p>
            </div>

            <GmailCard back="/outreach/link" />

            {result ? (
                <>
                    <div className="flex flex-wrap items-center gap-2 rounded-[16px] border border-line-soft bg-fill-3 p-3.5">
                        <span className="flex min-w-0 flex-[1_1_220px] flex-col">
                            <span className="text-[12.5px] text-ink-3">{t('found')}</span>
                            <strong className="text-[15px]">
                                {[result.draft.offer.title, result.draft.offer.company].filter(Boolean).join(' · ') || t('untitled')}
                            </strong>
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                setResult(null)
                                draft.reset()
                            }}
                        >
                            {t('another')}
                        </Button>
                    </div>
                    <CompanyRecruiters
                        key={result.url}
                        company={result.draft.offer.company ?? ''}
                        goal={result.draft.offer.title || undefined}
                        onPick={setTo}
                    />
                    <EmailComposer
                        heading={<strong className="text-lg">{t('composerTitle')}</strong>}
                        to={to}
                        onTo={setTo}
                        toHint={t('toHint')}
                        initial={{ subject: result.draft.subject, body: result.draft.body }}
                        language={language}
                        tone={tone}
                        resumes={resumeList}
                        resumeId={resume}
                        jobId={result.draft.job_id ?? undefined}
                        draft={(a) => ask(a, result.url, result.text)}
                    />
                </>
            ) : (
                <form
                    className="flex flex-col gap-4 rounded-[20px] border border-ink bg-white p-4 shadow-card sm:p-5"
                    onSubmit={(e) => {
                        e.preventDefault()
                        submit()
                    }}
                >
                    <label className={label}>
                        {t('url')}
                        <input
                            type="url"
                            dir="ltr"
                            inputMode="url"
                            maxLength={2048}
                            className={inputClass}
                            placeholder="https://"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value)
                                setNeedText(false)
                                draft.reset()
                            }}
                        />
                    </label>
                    {sourceChip}

                    {askText ? (
                        <label className={label}>
                            {t('pasteTitle')}
                            <span className="text-[12.5px] font-normal text-ink-3">{needText ? t('pasteHint') : t('linkedinNote')}</span>
                            <TextArea className="min-h-[180px]" maxLength={OFFER_TEXT_MAX} value={text} onChange={(e) => setText(e.target.value)} />
                        </label>
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className={label}>
                            {t('resume')}
                            <Select className={inputClass} value={resume} onChange={(e) => setResumeId(e.target.value)}>
                                <option value="">{t('noResume')}</option>
                                {resumeList.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.title}
                                    </option>
                                ))}
                            </Select>
                        </label>
                        <label className={label}>
                            {t('language')}
                            <Select className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value as LetterLanguage)}>
                                <option value="fr">Français</option>
                                <option value="en">English</option>
                                <option value="ar">العربية</option>
                            </Select>
                        </label>
                    </div>
                    <div className={label}>
                        <span>{t('tone')}</span>
                        <Segmented
                            label={t('tone')}
                            role="radiogroup"
                            value={tone}
                            onChange={setTone}
                            className="self-start"
                            options={[
                                { value: 'formal', label: t('formal') },
                                { value: 'friendly', label: t('friendly') },
                            ]}
                        />
                    </div>

                    {blocked ? <Paywall what="draft" reason={blocked} /> : null}
                    {status && status !== 402 && status !== 422 ? (
                        <p role="alert" className="m-0 rounded-[14px] border border-warn-line bg-warn-bg p-3 text-sm text-warn-fg">
                            {status === 404 ? t('notFound') : t('failed')}
                        </p>
                    ) : null}
                    {draft.isError && !isAxiosError(draft.error) ? (
                        <p role="alert" className="m-0 rounded-[14px] border border-warn-line bg-warn-bg p-3 text-sm text-warn-fg">
                            {t('failed')}
                        </p>
                    ) : null}

                    <Button type="submit" size="lg" className="sm:self-start" disabled={!ready || draft.isPending}>
                        <Icon name="pencil" /> {draft.isPending ? t('writing') : t('write')}
                    </Button>
                </form>
            )}

            {result ? null : (
                <section className="hidden flex-col gap-2 rounded-[16px] border border-line-soft bg-fill-3 p-3.5 sm:flex">
                    <strong className="text-[15px]">{t('send.title')}</strong>
                    <span className="text-[13.5px] text-ink-3">{t('send.hint')}</span>
                    <a
                        ref={button}
                        draggable
                        onClick={(e) => e.preventDefault()}
                        className="inline-flex h-9 cursor-grab items-center gap-1.5 self-start rounded-full bg-ink px-3.5 text-[13.5px] font-semibold text-lime"
                    >
                        <Icon name="link" size={14} /> {t('send.button')}
                    </a>
                </section>
            )}
        </main>
    )
}
