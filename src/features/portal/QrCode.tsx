import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { DownloadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

/** QR code of a link, drawn in the browser (no external service sees the link), with a PNG download. */
export function QrCode({ value, fileName }: { value: string; fileName: string }) {
  const { t } = useI18n()
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(value, { margin: 1, width: 480, errorCorrectionLevel: 'M' })
      .then((url) => !cancelled && setSrc(url))
      .catch(() => !cancelled && setSrc(null))
    return () => {
      cancelled = true
    }
  }, [value])

  if (!src) return <div className="size-40 animate-pulse rounded-md bg-muted" />
  return (
    <div className="flex flex-col items-center gap-2">
      <img src={src} alt={t('dashboard.qrAlt')} className="size-40 rounded-md bg-white p-1" />
      <Button asChild size="sm" variant="ghost">
        <a href={src} download={fileName}>
          <DownloadSimple />
          {t('dashboard.downloadQr')}
        </a>
      </Button>
    </div>
  )
}
