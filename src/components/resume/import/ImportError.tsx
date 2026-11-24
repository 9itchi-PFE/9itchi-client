'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Icon, type IconName } from '@/components/ui/icons'
import FileBadge from './FileBadge'

// ImportError is ErrCVImport: the file that failed, the usual reasons, and two ways on.
export default function ImportError({ fileName, onRetry, onBlank }: { fileName: string; onRetry: () => void; onBlank: () => void }) {
    const t = useTranslations('import')
    const reasons: [IconName, string, string][] = [
        ['file', t('errBlurryTitle'), t('errBlurryText')],
        ['lock', t('errPasswordTitle'), t('errPasswordText')],
        ['history', t('errSizeTitle'), t('errSizeText')],
    ]
    return (
        <div className="mx-auto flex w-full max-w-[656px] flex-col gap-5 rounded-3xl border-[1.5px] border-ink bg-white p-8 shadow-card" role="alert">
            {fileName ? (
                <div className="flex items-center gap-3 rounded-[14px] border border-[#FECDCA] bg-[#FEF3F2] px-3.5 py-3">
                    <FileBadge name={fileName} />
                    <div className="flex flex-col">
                        <strong className="text-[15px]">{fileName}</strong>
                        <span className="text-[13.5px] text-[#B42318]">{t('errFile')}</span>
                    </div>
                </div>
            ) : null}
            <h1 className="m-0 text-[30px] font-extrabold">{t('errTitle')}</h1>
            <p className="m-0 text-[15.5px] leading-[1.6] text-ink-3">{t('errLead')}</p>
            <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                {reasons.map(([icon, title, text]) => (
                    <li key={title} className="flex items-start gap-2.5">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-fill">
                            <Icon name={icon} size={15} />
                        </span>
                        <span className="flex flex-col gap-0.5">
                            <strong className="text-[14.5px]">{title}</strong>
                            <span className="text-[13.5px] text-ink-3">{text}</span>
                        </span>
                    </li>
                ))}
            </ul>
            <div className="flex flex-wrap gap-2.5">
                <Button size="lg" onClick={onRetry}>
                    {t('errRetry')}
                </Button>
                <Button size="lg" variant="secondary" onClick={onBlank}>
                    {t('blankTitle')}
                </Button>
            </div>
        </div>
    )
}
