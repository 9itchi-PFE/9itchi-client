'use client'

import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useCreateSchool, useDeleteSchool, useSchools, useUpdateSchool } from '@/hooks/useSchools'
import { schoolName } from '@/lib/schools'
import type { School } from '@/types/school'
import { SCHOOL_NAME_MAX, schoolInput, schoolNames } from './schools'
import { apiError } from './SourcesScreen'

// SchoolModal adds a school (a code that stays, and its name in the three languages) or renames one: the code of a
// school is what students' profiles keep, so it is fixed once the school exists.
function SchoolModal({ school, onClose }: { school?: School; onClose: () => void }) {
    const t = useTranslations('admin')
    const toast = useToast()
    const create = useCreateSchool()
    const update = useUpdateSchool()
    const [error, setError] = useState('')
    const busy = create.isPending || update.isPending

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const raw = {
            code: school?.code ?? String(f.get('code') ?? ''),
            name_fr: String(f.get('name_fr') ?? ''),
            name_en: String(f.get('name_en') ?? ''),
            name_ar: String(f.get('name_ar') ?? ''),
        }
        const done = {
            onSuccess: () => {
                toast(t('schSaved'))
                onClose()
            },
            onError: (err: unknown) => setError(isAxiosError(err) && err.response?.status === 409 ? t('schDuplicate') : (apiError(err) ?? t('stateError'))),
        }
        if (school) {
            const built = schoolNames(raw)
            if ('error' in built) return setError(t(built.error))
            setError('')
            update.mutate({ code: school.code, names: built.names }, done)
            return
        }
        const built = schoolInput(raw)
        if ('error' in built) return setError(t(built.error))
        setError('')
        create.mutate(built.input, done)
    }
    return (
        <Modal open onClose={onClose} title={school ? t('schEditTitle') : t('schAddTitle')} width={560}>
            <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
                <div className="flex flex-col gap-1.5">
                    <Field
                        name="code"
                        label={t('schCode')}
                        required
                        minLength={2}
                        maxLength={20}
                        dir="ltr"
                        autoCapitalize="characters"
                        readOnly={!!school}
                        className={school ? 'bg-fill-3 font-mono text-ink-3' : 'font-mono uppercase'}
                        defaultValue={school?.code}
                    />
                    <span className="text-[12.5px] text-ink-3">{school ? t('schCodeFixed') : t('schCodeHint')}</span>
                </div>
                <Field name="name_fr" label={t('schNameFr')} required maxLength={SCHOOL_NAME_MAX} defaultValue={school?.name_fr} />
                <Field name="name_en" label={t('schNameEn')} required maxLength={SCHOOL_NAME_MAX} dir="ltr" defaultValue={school?.name_en} />
                <Field name="name_ar" label={t('schNameAr')} required maxLength={SCHOOL_NAME_MAX} dir="rtl" defaultValue={school?.name_ar} />
                {error ? (
                    <p role="alert" className="m-0 text-sm text-[#B42318]">
                        {error}
                    </p>
                ) : null}
                <div className="flex justify-end pt-1">
                    <Button type="submit" disabled={busy}>
                        {t('save')}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

// SchoolsScreen is « Écoles »: the list students choose from at sign-up and in their settings. The team adds a school,
// renames it, or takes it off; students who already chose a removed school keep it.
export default function SchoolsScreen() {
    const t = useTranslations('admin')
    const locale = useLocale()
    const toast = useToast()
    const { data, isLoading, isError, refetch } = useSchools()
    const remove = useDeleteSchool()
    // editing: a school being renamed; adding: the form for a new one.
    const [editing, setEditing] = useState<School | null>(null)
    const [adding, setAdding] = useState(false)
    const [removing, setRemoving] = useState<School | null>(null)

    const confirmRemove = () => {
        if (!removing) return
        remove.mutate(removing.code, {
            onSuccess: () => {
                toast(t('schDeleted'))
                setRemoving(null)
            },
            onError: (err) => {
                toast(apiError(err) ?? t('stateError'))
                setRemoving(null)
            },
        })
    }
    return (
        <div className="mx-auto flex max-w-[1376px] flex-col gap-6 px-8 pb-16 pt-6 md:px-[60px]">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="m-0 font-display text-[40px] font-extrabold leading-[1.05] tracking-tightish">{t('schTitle')}</h1>
                    <p className="m-0 max-w-[760px] text-base leading-[1.55] text-ink-3">{t('schSubtitle')}</p>
                </div>
                <Button onClick={() => setAdding(true)}>{t('schAdd')}</Button>
            </div>
            <section aria-labelledby="schools-h" className="flex flex-col gap-2 rounded-[22px] border-[1.5px] border-ink bg-white p-5 shadow-card">
                <h2 id="schools-h" className="m-0 text-xl font-extrabold">
                    {data ? t('schCount', { count: data.length }) : t('schTitle')}
                </h2>
                {isError ? (
                    <div className="flex flex-wrap items-center gap-3 py-4">
                        <p role="alert" className="m-0 text-sm text-[#B42318]">
                            {t('schError')}
                        </p>
                        <Button variant="secondary" size="sm" onClick={() => refetch()}>
                            {t('schRetry')}
                        </Button>
                    </div>
                ) : null}
                <ul aria-busy={isLoading} className="m-0 flex list-none flex-col p-0">
                    {isLoading ? <li className="sk my-2 h-14 rounded-lg" /> : null}
                    {data?.map((s) => (
                        <li key={s.code} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line-soft py-3.5 first:border-t-0">
                            <span dir="ltr" className="w-[140px] flex-none truncate font-mono text-[13.5px] font-bold">
                                {s.code}
                            </span>
                            <span className="flex min-w-0 flex-[1_1_320px] flex-col gap-0.5 text-[14.5px]">
                                <bdi className="font-semibold">{s.name_fr}</bdi>
                                <bdi className="text-ink-3">{s.name_en}</bdi>
                                <bdi className="text-ink-3">{s.name_ar}</bdi>
                            </span>
                            <span className="flex flex-none gap-2">
                                <Button variant="secondary" size="sm" aria-label={t('schEditNamed', { name: s.code })} onClick={() => setEditing(s)}>
                                    {t('schEdit')}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="text-[#B42318] hover:text-[#912018]"
                                    aria-label={t('schDeleteNamed', { name: s.code })}
                                    onClick={() => setRemoving(s)}
                                >
                                    {t('schDelete')}
                                </Button>
                            </span>
                        </li>
                    ))}
                </ul>
                {data && data.length === 0 ? <p className="m-0 py-4 text-sm text-ink-3">{t('schEmpty')}</p> : null}
            </section>
            <p className="m-0 max-w-[760px] text-[13.5px] leading-[1.55] text-ink-3">{t('schNote')}</p>
            {adding ? <SchoolModal onClose={() => setAdding(false)} /> : null}
            {editing ? <SchoolModal school={editing} onClose={() => setEditing(null)} /> : null}
            <ConfirmDialog
                open={!!removing}
                title={t('schDeleteTitle')}
                confirmLabel={t('schDeleteBtn')}
                busy={remove.isPending}
                onConfirm={confirmRemove}
                onClose={() => setRemoving(null)}
            >
                {removing ? t('schDeleteConfirm', { name: schoolName(removing, locale), code: removing.code }) : ''}
            </ConfirmDialog>
        </div>
    )
}
