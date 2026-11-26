'use client'

import Link from 'next/link'
import { isAxiosError } from 'axios'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import { useMatch, useRunMatch } from '@/hooks/useApplications'
import { cn } from '@/lib/cn'
import type { MatchInput } from '@/types/application'
import { keywordBlock, left, levelTone, matchError } from './aiMatch'

// AiMatch is the AI's reading of the student's CV against one offer, on the offer panel. It is asked only when the
// student presses the button; a reading already made is shown at once and costs nothing.
export default function AiMatch({ jobId, resumeId }: { jobId: string; resumeId: string }) {
    const t = useTranslations('offers.ai')
    const format = useFormatter()
    const locale = useLocale()
    const input: MatchInput = { job_id: jobId, resume_id: resumeId, language: locale === 'en' || locale === 'ar' ? locale : 'fr' }
    const found = useMatch(input)
    const run = useRunMatch()
    const m = found.data ?? null
    const err = run.error
    const why = err ? matchError(isAxiosError(err) ? err.response?.status : undefined, isAxiosError(err) ? String(err.response?.data?.error ?? '') : '') : null
    const remaining = m ? left(m.limit, m.used) : null
    const kw = m ? keywordBlock(m) : null

    return (
        <section aria-labelledby={`ai-${jobId}`} aria-busy={run.isPending} className="flex flex-col gap-3 rounded-2xl bg-[#F6F5FF] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
                <h3 id={`ai-${jobId}`} className="m-0 flex items-center gap-2 font-display text-[17px] font-extrabold tracking-tightish">
                    {t('title')}
                </h3>
                {m ? (
                    <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold', levelTone[m.level])}>
                        <strong className="tabular-nums">{t('score', { score: m.score })}</strong>
                        <span aria-hidden>·</span>
                        {t(`level.${m.level}`)}
                    </span>
                ) : null}
            </div>
            {m ? (
                <>
                    {kw ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-3">
                                <h4 className="m-0 text-[13.5px] font-semibold">{t('keywords.title')}</h4>
                                <span className="text-[13px] font-semibold tabular-nums text-ink-2">
                                    {t('keywords.count', { found: kw.matched.length, total: kw.total, percent: kw.coverage })}
                                </span>
                            </div>
                            <div
                                role="progressbar"
                                aria-label={t('keywords.title')}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={kw.coverage}
                                className="h-1.5 overflow-hidden rounded-full bg-white"
                            >
                                <div className="h-full rounded-full bg-ok-fg" style={{ width: `${kw.coverage}%` }} />
                            </div>
                            {kw.missing.length ? (
                                <>
                                    <ul aria-label={t('keywords.missing')} className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                                        {kw.missing.map((k) => (
                                            <li key={k} className="rounded-full border border-warn-line px-2.5 py-0.5 text-[13px] font-medium text-warn-fg">
                                                {k}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="m-0 text-[13px] leading-[1.5] text-ink-3">
                                        {t('keywords.hint')}{' '}
                                        <Link href={`/resumes/${resumeId}`} className="font-semibold underline">
                                            {t('keywords.openCv')}
                                        </Link>
                                    </p>
                                </>
                            ) : null}
                            {kw.matched.length ? (
                                <ul aria-label={t('keywords.matched')} className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                                    {kw.matched.map((k) => (
                                        <li key={k} className="rounded-full bg-ok-bg px-2.5 py-0.5 text-[13px] font-medium text-ok-fg">
                                            {k}
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    ) : null}
                    {m.strengths.length ? (
                        <div className="flex flex-col gap-1.5">
                            <h4 className="m-0 text-[13.5px] font-semibold">{t('strengths')}</h4>
                            <ul className="m-0 flex list-none flex-col gap-1 p-0">
                                {m.strengths.map((s) => (
                                    <li key={s} className="flex gap-2 text-[14px] leading-[1.5] text-ink-2">
                                        <Icon name="check" size={14} strokeWidth={3} className="mt-[3px] flex-none text-ok-fg" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    {m.gaps.length ? (
                        <div className="flex flex-col gap-1.5">
                            <h4 className="m-0 text-[13.5px] font-semibold">{t('gaps')}</h4>
                            <ul className="m-0 flex list-disc flex-col gap-1 ps-5 text-[14px] leading-[1.5] text-ink-2">
                                {m.gaps.map((s) => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    {m.advice ? <p className="m-0 rounded-xl bg-white px-3 py-2.5 text-[14px] leading-[1.5]">{m.advice}</p> : null}
                    <span className="text-[12.5px] text-ink-3">
                        {t('madeOn', { date: format.dateTime(new Date(m.created_at), { day: 'numeric', month: 'short' }) })}
                        {remaining != null ? ` · ${t('left', { count: remaining })}` : ''}
                    </span>
                </>
            ) : (
                <>
                    <p className="m-0 text-[13.5px] leading-[1.55] text-ink-3">{t('intro')}</p>
                    {why ? (
                        <p role="alert" className="m-0 text-[13.5px] leading-[1.55] text-[#B42318]">
                            {t(`error.${why}`)}{' '}
                            {why === 'plan' || why === 'used' ? (
                                <Link href="/settings/billing" className="font-semibold underline">
                                    {t('seePlans')}
                                </Link>
                            ) : null}
                        </p>
                    ) : null}
                    <Button variant="secondary" size="sm" className="self-start" disabled={run.isPending || found.isLoading} onClick={() => run.mutate(input)}>
                        {run.isPending ? t('reading') : t('run')}
                    </Button>
                </>
            )}
        </section>
    )
}
