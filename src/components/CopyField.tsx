import { useState } from 'react'
import { Check, Copy } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { copyText } from '@/features/portal/share'
import { useI18n } from '@/i18n'

/** A read-only link with a copy button. */
export function CopyField({ value, label }: { value: string; label: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (await copyText(value)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error(t('common.copyFailed'))
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background/60 p-1 pl-3">
      <input
        readOnly
        aria-label={label}
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 truncate bg-transparent font-mono text-xs outline-none sm:text-sm"
      />
      <Button size="sm" variant={copied ? 'secondary' : 'default'} onClick={() => void copy()}>
        {copied ? <Check /> : <Copy />}
        {copied ? t('common.copied') : t('common.copy')}
      </Button>
    </div>
  )
}
