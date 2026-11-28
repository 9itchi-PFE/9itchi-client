'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { isAxiosError } from 'axios'
import { Button, ButtonLink } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/Field'
import { Icon } from '@/components/ui/icons'
import { useCompanyRecruiters } from '@/hooks/useRecruiters'
import { quotaReason } from '@/utils/quota'
import Paywall from './Paywall'
import { initials } from './outreach'

// CompanyRecruiters finds the recruiter at the company of an offer read from a link. It costs one Recruiter Radar
// search only when someone is found; the people found join the radar list. Choosing one fills the recipient. The
// company read from the offer can be corrected, or typed when the offer did not name it.
export default function CompanyRecruiters({ company, goal, onPick }: { company: string; goal?: string; onPick: (email: string) => void }) {
    const t = useTranslations('outreach.link.recruiter')
    const find = useCompanyRecruiters()
    const blocked = quotaReason(find.error)
    const status = isAxiosError(find.error) ? find.error.response?.status : undefined
    const items = find.data?.items ?? []
    const [name, setName] = useState(company)
    const typed = name.trim()

    return (
        <section className="flex flex-col gap-3 rounded-[16px] border border-line-soft bg-white p-3.5">
            <div className="flex flex-wrap items-center gap-2">
                <span className="flex min-w-0 flex-[1_1_220px] flex-col">
                    <strong className="text-[15px]">{typed ? t('title', { company: typed }) : t('titleNone')}</strong>
                    <span className="text-[12.5px] text-ink-3">{t('cost')}</span>
                </span>
            </div>
            {find.isSuccess ? null : (
                <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (typed) find.mutate({ company: typed, goal })
                    }}
                >
                    <label className="flex min-w-0 flex-[1_1_220px] flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                        {t('company')}
                        <input
                            className={inputClass}
                            maxLength={120}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                                find.reset()
                            }}
                        />
                    </label>
                    <Button type="submit" variant="secondary" size="sm" disabled={!typed || find.isPending}>
                        <Icon name="radar" size={14} /> {find.isPending ? t('finding') : t('find')}
                    </Button>
                </form>
            )}

            {blocked ? <Paywall what="search" reason={blocked} /> : null}
            {find.isError && !blocked ? (
                <p role="alert" className="m-0 rounded-[14px] border border-warn-line bg-warn-bg p-3 text-sm text-warn-fg">
                    {status === 404 ? t('nobody') : t('failed')}
                </p>
            ) : null}

            {items.length > 0 ? (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {items.map((r) => (
                        <li key={r.id} className="flex flex-wrap items-center gap-2.5 rounded-[12px] bg-fill-3 p-2.5">
                            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-ink text-[13px] font-bold text-lime">
                                {initials(r.name)}
                            </span>
                            <span className="flex min-w-0 flex-[1_1_180px] flex-col">
                                <strong className="truncate text-[14px]">{r.name}</strong>
                                <span className="truncate text-[12.5px] text-ink-3">{r.title || r.company}</span>
                                <span dir="ltr" className="truncate text-start text-[13px] text-ink-2">
                                    {r.email}
                                </span>
                            </span>
                            {r.email ? (
                                <Button size="sm" onClick={() => onPick(r.email)}>
                                    {t('use')}
                                </Button>
                            ) : null}
                        </li>
                    ))}
                </ul>
            ) : null}
            {find.isSuccess ? (
                <ButtonLink href="/outreach" variant="secondary" size="sm" className="self-start">
                    {t('radar')}
                </ButtonLink>
            ) : null}
        </section>
    )
}
