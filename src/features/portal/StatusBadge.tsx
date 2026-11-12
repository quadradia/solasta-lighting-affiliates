import { CheckCircle, Clock } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/i18n'
import type { Placement } from './api'

/** Not posted yet, in review, or approved with the Bucks it earned. */
export function StatusBadge({ placement }: { placement: Placement }) {
  const { t } = useI18n()
  if (placement.postStatus === 'Approved')
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle weight="fill" />
        {t('links.status.Approved', { count: placement.rewardBucks ?? 0 })}
      </Badge>
    )
  if (placement.postStatus === 'Pending')
    return (
      <Badge variant="warning" className="gap-1">
        <Clock />
        {t('links.status.Pending')}
      </Badge>
    )
  return <Badge variant="outline">{t('links.status.NotPosted')}</Badge>
}
