'use client'

import Link from 'next/link'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { useSessionContext } from '@/components/auth/AuthProvider'
import { Sk } from '@/components/jobs/OfferStates'
import { Button, ButtonLink } from '@/components/ui/Button'
import { LogoMark } from '@/components/ui/Logo'
import { usePayments, useReceiptIssuer } from '@/hooks/usePlans'
import { lines, months, tnd } from './billing'

const eyebrow = 'font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-ink-3'

// Legal is one legal mention of the receipt: its value once the admin has filled it in, and until then its name
// followed by a gap, the way a form leaves a line to write on.
// prefix names a value that says nothing alone (« MF » before the tax id); the value itself reads left to right in
// every language, as numbers and identifiers do.
function Legal({ label, value, missing, prefix }: { label: string; value?: string; missing: string; prefix?: string }) {
    if (value && prefix)
        return (
            <span>
                {prefix} <bdi dir="ltr">{value}</bdi>
            </span>
        )
    if (value) return <span>{value}</span>
    return (
        <span className="inline-flex items-baseline gap-1.5">
            {label}
            <span className="inline-block h-[1em] w-28 border-b border-ink-3" />
            <span className="sr-only">{missing}</span>
        </span>
    )
}

// ReceiptScreen is one receipt: who paid, how, what for and how much. « Télécharger en PDF » prints the page,
// which every browser can save as a PDF.
export default function ReceiptScreen({ id }: { id: string }) {
    const t = useTranslations('billing')
    const locale = useLocale()
    const format = useFormatter()
    const { user } = useSessionContext()
    const payments = usePayments()
    // A receipt that cannot read the legal mentions still shows: each of them is then a gap.
    const issuer = useReceiptIssuer().data
    const p = payments.data?.find((x) => x.id === id)
    const main = 'mx-auto box-border flex w-full max-w-[900px] flex-1 flex-col gap-4 px-8 pb-16 pt-4'

    if (payments.isLoading) {
        return (
            <main aria-busy="true" className={main}>
                <Sk className="h-[520px] w-full rounded-md" />
            </main>
        )
    }
    if (!p) {
        return (
            <main className={main}>
                <h1 className="m-0 text-[30px] font-extrabold">{t('receiptMissing')}</h1>
                <ButtonLink href="/settings/billing" className="self-start">
                    {t('title')}
                </ButtonLink>
            </main>
        )
    }

    const l = lines(p)
    const m = months(p.duration_days)
    const length = m === null ? t('days', { count: p.duration_days }) : t('months', { count: m })
    const day = (iso: string) => format.dateTime(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' })
    const period = p.period_start && p.period_end ? ` (${day(p.period_start)} → ${day(p.period_end)})` : ''
    const row = 'flex justify-between gap-4 border-b border-line-soft px-4 py-4 text-[15px]'
    return (
        <main className={main}>
            {/* Printing keeps the receipt only: the header of the app and the buttons stay on screen. */}
            <style>{`@media print { header, .no-print { display: none !important } body { background: #fff !important } .receipt { box-shadow: none !important } }`}</style>
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
                <Link href="/settings/billing" className="text-[15px] font-semibold no-underline">
                    <span className="inline-block rtl:rotate-180">←</span> {t('title')}
                </Link>
                <Button variant="secondary" onClick={() => window.print()}>
                    {t('downloadPdf')}
                </Button>
            </div>
            <article className="receipt flex flex-col gap-9 rounded-md bg-white px-8 py-10 shadow-paper md:px-16 md:py-14">
                <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3.5">
                            <LogoMark size={40} />
                            <strong className="font-display text-[22px] font-extrabold">9itchi PFE</strong>
                        </div>
                        <div className="flex max-w-[420px] flex-col gap-1 text-[13.5px] leading-[1.5] text-ink-3">
                            <Legal label={t('legalName')} value={issuer?.legal_name} missing={t('toFill')} />
                            <Legal label={t('legalAddress')} value={issuer?.address} missing={t('toFill')} />
                            <Legal label={t('taxId')} value={issuer?.tax_id} prefix={t('taxIdShort')} missing={t('toFill')} />
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-end">
                        <h1 className="m-0 text-[24px] font-extrabold">{t('receipt')}</h1>
                        <span dir="ltr" className={eyebrow}>
                            N° {p.receipt_no}
                        </span>
                        <span className="text-[15px] text-ink-3">
                            {p.completed_at ? format.dateTime(new Date(p.completed_at), { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                        </span>
                    </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <span className={eyebrow}>{t('for')}</span>
                        <strong className="text-[15.5px] font-semibold">{user?.name}</strong>
                        <span dir="ltr" className="self-start text-[15px]">
                            {user?.email}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className={eyebrow}>{t('payment')}</span>
                        <span className="text-[15.5px]">{p.provider === 'flouci' ? 'Flouci' : p.provider}</span>
                        {p.provider_ref ? (
                            <span className="text-[15px]">
                                {t('ref')} <span dir="ltr">{p.provider_ref}</span>
                            </span>
                        ) : null}
                    </div>
                </div>
                <div>
                    <div className="flex justify-between gap-4 bg-fill-3 px-4 py-3 text-sm font-medium text-ink-3">
                        <span>{t('description')}</span>
                        <span>{t('amountTnd')}</span>
                    </div>
                    <div className={row}>
                        <span>
                            {p.plan_name} · {length}
                            {period}
                        </span>
                        <span className="tabular-nums">{tnd(l.price + l.launch, locale)}</span>
                    </div>
                    {l.launch > 0 ? (
                        <div className={row}>
                            <span>{t('launchPrice')}</span>
                            <span className="tabular-nums">−{tnd(l.launch, locale)}</span>
                        </div>
                    ) : null}
                    {l.discount > 0 ? (
                        <div className={row}>
                            <span>{p.promo_code ? t('promoLine', { code: p.promo_code }) : t('discount')}</span>
                            <span className="tabular-nums">−{tnd(l.discount, locale)}</span>
                        </div>
                    ) : null}
                    <div className={`${row} items-baseline font-semibold`}>
                        <span>{t('totalPaid')}</span>
                        <span className="text-[22px] font-bold tabular-nums">{tnd(l.paid, locale)}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2 text-[13.5px] leading-[1.6] text-ink-3">
                    <Legal label={t('vat')} value={issuer?.vat_mention} missing={t('toFill')} />
                    <p className="m-0">{t('receiptNote')}</p>
                </div>
            </article>
        </main>
    )
}
