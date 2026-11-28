'use client'

import { useTranslations } from 'next-intl'
import { inputClass } from '@/components/ui/Field'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import type { AttachmentNames } from '@/types/application'
import { LETTER_MAX, letterStem, sameName, type LetterChoice } from './attachments'

// AttachmentFields are the files an email carries: the CV under its name (renamed in the CV section, not here) and
// the cover letter as a PDF whose name the student can change. cvFilename '' hides the CV line (no CV attached);
// no value/onChange hides the letter (outreach emails carry none).
export default function AttachmentFields({
    cvFilename,
    names,
    value,
    onChange,
    disabled,
}: {
    cvFilename: string
    names?: AttachmentNames
    value?: LetterChoice
    onChange?: (c: LetterChoice) => void
    disabled?: boolean
}) {
    const t = useTranslations('outreach.attachments')
    if (!value || !onChange)
        return cvFilename ? (
            <div className="flex min-w-0 flex-col rounded-[14px] bg-fill-3 p-3">
                <CvRow cvFilename={cvFilename} />
            </div>
        ) : null
    const stem = letterStem(value, names)
    const same = value.attach && sameName(stem, cvFilename)

    return (
        <div className="flex min-w-0 flex-col gap-2.5 rounded-[14px] bg-fill-3 p-3">
            {cvFilename ? <CvRow cvFilename={cvFilename} /> : null}
            <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm font-medium text-ink">
                <input
                    type="checkbox"
                    className="h-5 w-5 flex-none accent-ink"
                    checked={value.attach}
                    disabled={disabled}
                    onChange={(e) => onChange({ ...value, attach: e.target.checked })}
                />
                {t('attachLetter')}
            </label>
            {value.attach ? (
                <label className="flex min-w-0 flex-col gap-1.5 text-[13.5px] font-medium text-ink-2">
                    {t('letterName')}
                    <span className="flex min-w-0 items-stretch">
                        <input
                            dir="auto"
                            maxLength={LETTER_MAX}
                            value={stem}
                            disabled={disabled}
                            aria-invalid={same}
                            onChange={(e) => onChange({ ...value, name: e.target.value, edited: true })}
                            className={cn(inputClass, 'min-w-0 flex-1 rounded-e-none', same && 'border-[#B42318]')}
                        />
                        <span
                            dir="ltr"
                            className="flex flex-none items-center rounded-e-[10px] border border-s-0 border-line-strong bg-white px-2.5 font-mono text-[13px] text-ink-3"
                        >
                            .pdf
                        </span>
                    </span>
                    {same ? (
                        <span role="alert" className="text-[12.5px] font-normal text-[#B42318]">
                            {t('sameName')}
                        </span>
                    ) : null}
                </label>
            ) : null}
        </div>
    )
}

// CvRow is the CV attached under its name (read-only: renamed in the CV section).
function CvRow({ cvFilename }: { cvFilename: string }) {
    const t = useTranslations('outreach.attachments')
    return (
        <div className="flex min-w-0 items-start gap-2 text-[13.5px] text-ink-2">
            <Icon name="file" size={16} className="mt-0.5 flex-none text-ink-3" />
            <span className="min-w-0">
                <span className="font-medium">{t('cvName')}</span>{' '}
                <bdi className="break-all text-ink" dir="auto">
                    {cvFilename}
                </bdi>
                <span className="block text-[12px] text-ink-3">{t('nameHint')}</span>
            </span>
        </div>
    )
}
