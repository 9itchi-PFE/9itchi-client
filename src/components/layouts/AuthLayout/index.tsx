import type { PropsWithChildren } from 'react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { LogoMark } from '@/components/ui/Logo'

// AuthLayout is the sign-in screen of the canvas: the dark story panel on one side, the form on the other.
export default async function AuthLayout({ children }: PropsWithChildren) {
    const t = await getTranslations('auth')
    return (
        <div className="flex min-h-screen flex-wrap">
            <section className="box-border flex min-w-0 flex-[1_1_480px] flex-col justify-between gap-12 bg-ink px-14 py-12 text-white">
                <Link href="/" className="flex items-center gap-2.5 text-white no-underline hover:text-white">
                    <LogoMark size={40} />
                    <span className="font-display text-2xl font-extrabold">9itchi</span>
                    <span className="rounded-md bg-lime px-[7px] py-[3px] font-mono text-[11px] font-semibold tracking-[.1em] text-ink">PFE</span>
                </Link>
                <div className="flex max-w-[520px] flex-col gap-5">
                    <h1 className="m-0 text-[48px] font-extrabold leading-[1.08]">
                        {t.rich('heroTitle', { mark: (c) => <span className="rounded-md bg-lime px-2 text-ink">{c}</span> })}
                    </h1>
                    <p className="m-0 text-[17px] leading-[1.6] text-[#C8CBD3]">{t('heroText')}</p>
                    <div aria-hidden className="relative mt-3 h-[250px]">
                        <div className="absolute left-0 top-0 flex w-[400px] max-w-[92%] -rotate-2 flex-col gap-2.5 rounded-2xl bg-white p-[18px] text-ink shadow-[0_20px_40px_rgba(0,0,0,.35)] rtl:left-auto rtl:right-0">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9F7B0] text-[13px] font-bold">NP</span>
                                <span className="flex flex-col">
                                    <span className="text-[12.5px] text-ink-3">
                                        <strong className="text-ink">{t('cardCompany')}</strong> · {t('cardCity')}
                                    </span>
                                    <strong className="text-[14.5px] font-semibold leading-[1.3]">{t('cardTitle')}</strong>
                                </span>
                            </div>
                            <div className="flex gap-3 text-[12.5px] text-ink-2">
                                <strong>{t('cardPay')}</strong>
                                <span>{t('cardLength')}</span>
                                <span>{t('cardMode')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-[22px] items-center rounded-full bg-lime px-2 text-xs font-semibold">{t('cardFit')}</span>
                                <span className="text-xs font-semibold text-violet">{t('cardEasy')}</span>
                            </div>
                        </div>
                        <div className="absolute end-[4%] top-24 flex w-[210px] rotate-3 flex-col gap-[5px] rounded-md bg-white px-4 py-3.5 font-cv text-[8.5px] text-[#1A1A1A] shadow-[0_20px_40px_rgba(0,0,0,.35)]">
                            <strong className="text-xs">{t('cvName')}</strong>
                            <span className="text-cv-blue [font-variant:small-caps]">{t('cvHeadline')}</span>
                            <span className="mt-1 border-b border-cv-blue uppercase text-cv-blue">{t('cvSection')}</span>
                            <span dir="ltr">{t('cvLine')}</span>
                            <span className="mt-1 inline-flex self-start rounded-full bg-ok-bg px-1.5 py-0.5 text-[9px] font-semibold text-ok-fg">
                                {t('cvChecks')}
                            </span>
                        </div>
                    </div>
                </div>
                <span className="inline-flex flex-wrap items-center gap-2.5 text-sm text-[#C8CBD3]">
                    <span className="rounded-md bg-lime px-2 py-1 font-mono text-xs font-semibold text-ink">
                        <s>{t('priceOld')}</s> {t('priceNew')}
                    </span>
                    {t('priceText')}
                </span>
            </section>
            <section className="box-border flex min-w-0 flex-[1_1_480px] items-center justify-center px-6 py-12">
                <div className="flex w-full max-w-[420px] flex-col gap-[22px]">{children}</div>
            </section>
        </div>
    )
}
