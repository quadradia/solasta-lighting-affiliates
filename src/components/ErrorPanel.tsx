import { WarningCircle } from '@phosphor-icons/react'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

/** Shows a failed query with its message, the API trace id (for support) and a retry button. */
export function ErrorPanel({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n()
  const apiError = error instanceof ApiError ? error : undefined
  const lines = apiError ? apiError.details : [error instanceof Error ? error.message : t('common.somethingWrong')]

  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
      <WarningCircle className="mt-0.5 size-5 shrink-0 text-red-300" />
      <div className="flex flex-1 flex-col gap-1">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {apiError?.traceId ? <p className="text-xs text-muted-foreground">{t('common.traceId', { id: apiError.traceId })}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('common.tryAgain')}
        </Button>
      ) : null}
    </div>
  )
}
