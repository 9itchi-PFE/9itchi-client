'use client'

import { useTranslations } from 'next-intl'
import CvPreview from '@/components/resume/CvPreview'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useAdminTemplates, usePublishTemplate } from '@/hooks/useTemplates'
import { cn } from '@/lib/cn'
import type { AdminTemplate } from '@/types/resume'
import { apiError } from './SourcesScreen'
import { SAMPLE_CV, canWithdraw, ordered } from './templates'

// TemplatesScreen is « Modèles CV »: the templates students choose from, how many CVs use each, and whether it is
// offered. A template is published or withdrawn here; a new one is a new layout, drawn in the code.
export default function TemplatesScreen() {
    const t = useTranslations('admin')
    const tl = useTranslations('templates')
    const toast = useToast()
    const { data, isLoading, isError } = useAdminTemplates()
    const publish = usePublishTemplate()
    const all = ordered(data ?? [])
    const name = (tpl: AdminTemplate) => tl(`layouts.${tpl.layout}.name`)

    const toggle = (tpl: AdminTemplate) => {
        if (tpl.active && !window.confirm(t('tplWithdrawConfirm', { name: name(tpl), count: tpl.resumes }))) return
        publish.mutate(
            { id: tpl.id, active: !tpl.active },
            {
                onSuccess: () => toast(t(tpl.active ? 'tplWithdrawn' : 'tplPublishedToast', { name: name(tpl) })),
                onError: (e) => toast(apiError(e) ?? t('stateError')),
            },
        )
    }
    return (
        <div className="mx-auto flex max-w-[1376px] flex-col gap-6 px-8 pb-16 pt-6 md:px-[60px]">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 font-display text-[40px] font-extrabold leading-[1.05] tracking-tightish">{t('tplTitle')}</h1>
                <p className="m-0 max-w-[760px] text-base leading-[1.55] text-ink-3">{t('tplSubtitle')}</p>
            </div>
            {isError ? (
                <p role="alert" className="m-0 text-sm text-[#B42318]">
                    {t('tplError')}
                </p>
            ) : null}
            <ul aria-busy={isLoading} className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 p-0">
                {isLoading ? [0, 1, 2].map((i) => <li key={i} className="sk h-[520px] rounded-[18px]" />) : null}
                {all.map((tpl) => (
                    <li key={tpl.id} className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5">
                        <div className={cn('pointer-events-none aspect-[210/297] overflow-hidden', !tpl.active && 'opacity-50')} aria-hidden>
                            <CvPreview content={SAMPLE_CV} layout={tpl.layout} language="fr" photoUrl={null} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="m-0 text-base font-bold">{name(tpl)}</h2>
                                <span
                                    className={cn(
                                        'inline-block rounded-full px-2.5 py-[3px] text-[13px] font-semibold',
                                        tpl.active ? 'bg-ok-bg text-ok-fg' : 'bg-fill text-ink-3',
                                    )}
                                >
                                    {t(tpl.active ? 'tplPublished' : 'tplOff')}
                                </span>
                            </div>
                            <p className="m-0 text-sm leading-normal text-ink-3">{t('tplUse', { count: tpl.resumes })}</p>
                        </div>
                        <div className="mt-auto flex flex-col gap-1.5">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="self-start"
                                disabled={publish.isPending || (tpl.active && !canWithdraw(tpl, all))}
                                onClick={() => toggle(tpl)}
                            >
                                {t(tpl.active ? 'tplWithdraw' : 'tplPublish')}
                            </Button>
                            {tpl.active && !canWithdraw(tpl, all) ? <p className="m-0 text-[12.5px] text-ink-3">{t('tplLast')}</p> : null}
                        </div>
                    </li>
                ))}
            </ul>
            {data && data.length === 0 ? <p className="m-0 text-sm text-ink-3">{t('tplEmpty')}</p> : null}
            <p className="m-0 max-w-[760px] text-[13.5px] leading-[1.55] text-ink-3">{t('tplNote')}</p>
        </div>
    )
}
