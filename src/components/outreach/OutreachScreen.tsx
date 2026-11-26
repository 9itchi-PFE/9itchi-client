'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { useRecruiterAllowance, useRecruiterDraft, useRecruiters, useSearchRecruiters } from '@/hooks/useRecruiters'
import { useResumes } from '@/hooks/useResumes'
import { quotaReason } from '@/utils/quota'
import type { RecruiterSearch, RecruiterSearchInput } from '@/types/recruiter'
import AllowanceMeter from './AllowanceMeter'
import EmailComposer from './EmailComposer'
import GmailCard from './GmailCard'
import Paywall from './Paywall'
import RecruiterList from './RecruiterList'
import ScheduledList from './ScheduledList'
import SearchPanel from './SearchPanel'

const small = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
const scrollTo = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))

// OutreachScreen is Recruiter Radar: the student searches recruiters (a few searches a day with a subscription), picks
// one, has the AI write a spontaneous application for the goal they typed, and sends it from their Gmail now or later.
export default function OutreachScreen() {
    const t = useTranslations('outreach')
    const resumes = useResumes()
    const recruiters = useRecruiters()
    const allowance = useRecruiterAllowance()
    const search = useSearchRecruiters()
    const draft = useRecruiterDraft()
    const [resumeId, setResumeId] = useState<string | null>(null)
    const [goal, setGoal] = useState('Stage PFE')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    // typed are addresses the student added or changed for a recruiter (this page only).
    const [typed, setTyped] = useState<Record<string, string>>({})
    const [last, setLast] = useState<RecruiterSearch | null>(null)

    const resumeList = resumes.data?.items ?? []
    const resume = resumeId ?? resumeList[0]?.id ?? ''
    const items = (recruiters.data ?? []).map((r) => (r.id in typed ? { ...r, email: typed[r.id] } : r))
    const selected = items.find((r) => r.id === selectedId) ?? null

    // 402 on the allowance, or a limit of 0: the radar is part of the subscription.
    const a = allowance.data
    const blocked = quotaReason(search.error) ?? quotaReason(allowance.error) ?? (a?.limit === 0 ? 'plan' : a && a.remaining === 0 ? 'used' : null)

    const select = (id: string) => {
        setSelectedId(id)
        if (small()) scrollTo('radar-detail')
    }
    const run = (input: RecruiterSearchInput) =>
        search.mutate(input, {
            onSuccess: (r) => {
                setLast(r)
                if (small()) scrollTo('radar-list')
            },
        })

    return (
        <main className="mx-auto box-border flex w-full max-w-[1320px] flex-1 flex-col gap-5 px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
            <div className="flex items-start gap-3">
                <span className="mt-1 hidden h-12 w-12 flex-none items-center justify-center rounded-2xl bg-ink text-lime sm:flex">
                    <Icon name="radar" size={26} />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                    <h1 className="m-0 font-display text-[28px] font-extrabold leading-[1.05] sm:text-[38px]">{t('title')}</h1>
                    <p className="m-0 text-[15px] text-ink-3">{t('intro')}</p>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <GmailCard back="/outreach" />
                {blocked === 'plan' ? <Paywall what="search" reason="plan" /> : <AllowanceMeter allowance={a} loading={allowance.isLoading} />}
            </div>

            <SearchPanel
                resumes={resumeList}
                resumeId={resume}
                onResume={setResumeId}
                goal={goal}
                onGoal={setGoal}
                busy={search.isPending}
                disabled={!!blocked}
                onSearch={run}
            />
            {blocked === 'used' ? <Paywall what="search" reason="used" /> : null}
            {search.isError && !quotaReason(search.error) ? (
                <p role="alert" className="m-0 rounded-[16px] border border-warn-line bg-warn-bg p-4 text-sm text-warn-fg">
                    {t('searchFailed')}
                </p>
            ) : null}
            {last ? (
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-3" aria-live="polite">
                    <span>{t('found', { count: last.items.length })}</span>
                    {last.provider === 'fake' ? <span className="rounded-full bg-warn-bg px-2.5 py-1 font-semibold text-warn-fg">{t('demo')}</span> : null}
                    {last.cached ? <span className="rounded-full bg-fill px-2.5 py-1 font-medium text-ink-2">{t('cached')}</span> : null}
                </div>
            ) : null}

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="min-w-0 lg:w-[420px] lg:flex-none">
                    <RecruiterList
                        items={items}
                        loading={recruiters.isLoading}
                        error={recruiters.isError}
                        selectedId={selectedId}
                        onSelect={select}
                        onEmail={(id, email) => setTyped((m) => ({ ...m, [id]: email }))}
                    />
                </div>
                <section id="radar-detail" aria-label={t('detail')} className="flex min-w-0 flex-1 scroll-mt-[84px] flex-col gap-3 lg:sticky lg:top-[84px]">
                    {selected ? (
                        <>
                            <Button variant="link" className="self-start lg:hidden" onClick={() => scrollTo('radar-list')}>
                                <Icon name="left" className="rtl:rotate-180" /> {t('back')}
                            </Button>
                            <EmailComposer
                                key={selected.id}
                                heading={
                                    <>
                                        <strong className="text-lg">{selected.name}</strong>
                                        <span className="text-[13.5px] text-ink-3">{[selected.title, selected.company].filter(Boolean).join(' · ')}</span>
                                    </>
                                }
                                to={selected.email}
                                onTo={(email) => setTyped((m) => ({ ...m, [selected.id]: email }))}
                                toHint={selected.email ? undefined : t('toHint')}
                                resumes={resumeList}
                                resumeId={resume}
                                draft={async (ask) => draft.mutateAsync({ id: selected.id, input: { ...ask, goal: goal.trim() || undefined } })}
                            />
                        </>
                    ) : (
                        <div className="hidden flex-col items-center gap-2 rounded-[20px] border border-dashed border-line-strong bg-white px-6 py-12 text-center lg:flex">
                            <Icon name="send" size={28} className="text-ink-4" />
                            <p className="m-0 text-sm text-ink-3">{t('pick')}</p>
                        </div>
                    )}
                </section>
            </div>

            <ScheduledList resumes={resumeList} />
        </main>
    )
}
