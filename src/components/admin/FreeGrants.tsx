'use client'

import { useState, type FormEvent } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, TextArea, inputClass } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useDeleteFreeGrant, useFreeGrants, useGiveFreeGrants, useSaveFreeGrant } from '@/hooks/useAdminPlans'
import { cn } from '@/lib/cn'
import type { FreeGrant } from '@/types/plan'
import { GRANTS_MAX, GRANT_NOTE_MAX, emailsOf, grantQuotas, grantSummary, grantTyped } from './grants'
import { COUNTS } from './plans'
import { apiError } from './SourcesScreen'

const card = 'flex flex-col gap-4 rounded-[22px] border border-line bg-white p-5'
const head = 'rounded-[10px] bg-fill-3 py-2.5 text-[13px] font-semibold text-ink-3'
const line = 'border-b border-line-soft py-3.5 text-[14.5px]'

function Problem({ children }: { children: string }) {
    if (!children) return null
    return (
        <p role="alert" className="m-0 text-sm text-[#B42318]">
            {children}
        </p>
    )
}

// Counts are the number fields of a grant, one per known quota; an empty field leaves the Free plan's value.
function Counts({ typed, onChange }: { typed: Record<string, string>; onChange: (next: Record<string, string>) => void }) {
    const t = useTranslations('admin')
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COUNTS.map((k) => (
                <label key={k} className="flex min-w-0 flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                    {t(`quota.${k}`)}
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder={t('grantKeepFree')}
                        value={typed[k] ?? ''}
                        onChange={(e) => onChange({ ...typed, [k]: e.target.value })}
                        className={cn(inputClass, 'tabular-nums')}
                    />
                </label>
            ))}
        </div>
    )
}

function GrantModal({ grant, onClose }: { grant: FreeGrant | undefined; onClose: () => void }) {
    const t = useTranslations('admin')
    const toast = useToast()
    const tc = useTranslations('common')
    const save = useSaveFreeGrant()
    const [typed, setTyped] = useState<Record<string, string>>(() => grantTyped(grant?.quotas ?? {}))
    const [note, setNote] = useState(grant?.note ?? '')
    const [error, setError] = useState('')

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!grant) return
        const quotas = grantQuotas(typed)
        if (!quotas) return setError(t('grantQuotasBad'))
        setError('')
        save.mutate(
            { email: grant.email, quotas, note: note.trim() },
            {
                onSuccess: () => {
                    toast(t('grantSaved'))
                    onClose()
                },
                onError: (err) => setError(apiError(err) ?? t('stateError')),
            },
        )
    }
    return (
        <Modal open={!!grant} onClose={onClose} title={grant?.email ?? ''} eyebrow={t('grantsTitle')} width={760}>
            <form onSubmit={submit} className="flex flex-col gap-3.5">
                <Counts typed={typed} onChange={setTyped} />
                <Field label={t('grantNote')} maxLength={GRANT_NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} />
                <Problem>{error}</Problem>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        {tc('cancel')}
                    </Button>
                    <Button type="submit" disabled={save.isPending}>
                        {t('save')}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

// FreeGrants is « Accès gratuit »: the team gives usage to some emails. A grant replaces the Free plan quotas key
// by key for a student signed in with Google or LinkedIn on that email, while they have no paid subscription.
export default function FreeGrants() {
    const t = useTranslations('admin')
    const format = useFormatter()
    const toast = useToast()
    const grants = useFreeGrants()
    const give = useGiveFreeGrants()
    const remove = useDeleteFreeGrant()
    const [emails, setEmails] = useState('')
    const [typed, setTyped] = useState<Record<string, string>>({})
    const [note, setNote] = useState('')
    const [error, setError] = useState('')
    const [editing, setEditing] = useState<FreeGrant | undefined>(undefined)
    const [deleting, setDeleting] = useState<FreeGrant | undefined>(undefined)
    const cols = 'grid grid-cols-[1.4fr_2fr_1fr_.8fr_200px] items-center gap-3 px-4'
    const label = (k: string) => ((COUNTS as readonly string[]).includes(k) ? t(`quota.${k}`) : k)
    const list = emailsOf(emails)

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (list.length === 0) return setError(t('grantEmailsNone'))
        if (list.length > GRANTS_MAX) return setError(t('grantEmailsMany', { max: GRANTS_MAX }))
        const quotas = grantQuotas(typed)
        if (!quotas) return setError(t('grantQuotasBad'))
        setError('')
        give.mutate(
            { emails: list, quotas, ...(note.trim() ? { note: note.trim() } : {}) },
            {
                onSuccess: (saved) => {
                    toast(t('grantGiven', { count: saved.length }))
                    setEmails('')
                    setTyped({})
                    setNote('')
                },
                onError: (err) => setError(apiError(err) ?? t('stateError')),
            },
        )
    }
    const confirmDelete = () => {
        if (!deleting) return
        remove.mutate(deleting.email, {
            onSuccess: () => {
                toast(t('grantDeleted', { email: deleting.email }))
                setDeleting(undefined)
            },
            onError: (err) => toast(apiError(err) ?? t('stateError')),
        })
    }
    return (
        <section aria-labelledby="grants-h" id="free-grants" className={card}>
            <div className="flex flex-col gap-1.5">
                <h2 id="grants-h" className="m-0 text-xl font-extrabold">
                    {t('grantsTitle')}
                </h2>
                <p className="m-0 max-w-[820px] text-[14.5px] leading-[1.55] text-ink-3">{t('grantsIntro')}</p>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-3.5">
                <label className="flex flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                    {t('grantEmails')}
                    <TextArea rows={4} dir="ltr" placeholder="ali@enis.tn, sara@gmail.com" value={emails} onChange={(e) => setEmails(e.target.value)} />
                    <span className="text-[13px] font-normal text-ink-3">{t('grantEmailsCount', { count: list.length })}</span>
                </label>
                <Counts typed={typed} onChange={setTyped} />
                <Field label={t('grantNote')} maxLength={GRANT_NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} />
                <Problem>{error}</Problem>
                <div>
                    <Button type="submit" disabled={give.isPending}>
                        {t('grantGive')}
                    </Button>
                </div>
            </form>
            <div role="table" aria-labelledby="grants-h" className="overflow-x-auto">
                <div role="row" className={cn(cols, 'min-w-[900px]', head)}>
                    <span role="columnheader">{t('colGrantEmail')}</span>
                    <span role="columnheader">{t('colGrantQuotas')}</span>
                    <span role="columnheader">{t('grantNote')}</span>
                    <span role="columnheader">{t('colGrantDate')}</span>
                    <span role="columnheader" className="sr-only">
                        {t('colAction')}
                    </span>
                </div>
                {grants.isLoading ? <div className="sk m-4 h-12 rounded-lg" /> : null}
                {grants.isError ? <p className="m-0 px-4 py-6 text-sm text-[#B42318]">{t('grantsError')}</p> : null}
                {grants.data && grants.data.length === 0 ? <p className="m-0 px-4 py-6 text-sm text-ink-3">{t('noGrants')}</p> : null}
                {grants.data?.map((g) => (
                    <div role="row" key={g.email} className={cn(cols, 'min-w-[900px]', line)}>
                        <span role="cell" dir="ltr" className="min-w-0 truncate text-start font-semibold">
                            {g.email}
                        </span>
                        <span role="cell" className="min-w-0 text-[13.5px] text-ink-2">
                            {grantSummary(g.quotas, label)}
                        </span>
                        <span role="cell" className="min-w-0 truncate text-ink-3">
                            {g.note || '—'}
                        </span>
                        <span role="cell">{format.dateTime(new Date(g.updated_at || g.created_at), { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span role="cell" className="flex justify-end gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setEditing(g)}>
                                {t('promoChange')}
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => setDeleting(g)}>
                                {t('grantDelete')}
                            </Button>
                        </span>
                    </div>
                ))}
            </div>
            <GrantModal key={editing?.email ?? 'closed'} grant={editing} onClose={() => setEditing(undefined)} />
            <ConfirmDialog
                open={!!deleting}
                title={t('grantDeleteTitle', { email: deleting?.email ?? '' })}
                confirmLabel={t('grantDelete')}
                busy={remove.isPending}
                onConfirm={confirmDelete}
                onClose={() => setDeleting(undefined)}
            >
                {t('grantDeleteText')}
            </ConfirmDialog>
        </section>
    )
}
