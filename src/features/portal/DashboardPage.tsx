import { Link } from 'react-router'
import { ArrowRight, ShareNetwork } from '@phosphor-icons/react'
import { ErrorPanel } from '@/components/ErrorPanel'
import { CopyField } from '@/components/CopyField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { NotAnAffiliate } from '@/components/RequireAffiliate'
import { useI18n } from '@/i18n'
import { ApiError } from '@/lib/api'
import { formatNumber } from '@/lib/format'
import { useMe } from './api'
import { QrCode } from './QrCode'
import { canNativeShare, nativeShare } from './share'

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="flex flex-col gap-1 px-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={highlight ? 'text-3xl font-semibold text-primary' : 'text-2xl font-semibold'}>{value}</span>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { t } = useI18n()
  const me = useMe()

  if (me.error instanceof ApiError && me.error.status === 403) return <NotAnAffiliate />
  if (me.error) return <ErrorPanel error={me.error} onRetry={() => void me.refetch()} />
  if (!me.data)
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    )

  const data = me.data
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('dashboard.greeting', { name: data.firstName })}</h1>
        <p className="text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t('dashboard.balance')} value={formatNumber(data.bucksBalance)} highlight />
        <Stat label={t('dashboard.thisMonth')} value={formatNumber(data.bucksEarnedThisMonth)} />
        <Stat label={t('dashboard.postsPending')} value={formatNumber(data.postsPending)} />
        <Stat label={t('dashboard.postsApproved')} value={formatNumber(data.postsApproved)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.referralTitle')}</CardTitle>
          <CardDescription>{t('dashboard.referralBody')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <CopyField value={data.referralUrl} label={t('dashboard.referralTitle')} />
            <p className="text-sm text-muted-foreground">{t('dashboard.code', { code: data.affiliateCode })}</p>
            {canNativeShare() ? (
              <Button
                variant="outline"
                className="self-start"
                onClick={() => void nativeShare(data.referralUrl, t('dashboard.shareText'), t('app.name'))}
              >
                <ShareNetwork />
                {t('dashboard.share')}
              </Button>
            ) : null}
          </div>
          <QrCode value={data.referralUrl} fileName={`solasta-${data.affiliateCode}.png`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.howTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
            <li>{t('dashboard.howPost')}</li>
            <li>{t('dashboard.howPurchase')}</li>
            <li>{t('dashboard.howRedeem')}</li>
          </ul>
          <Button asChild className="self-start">
            <Link to="/share">
              {t('dashboard.startSharing')}
              <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
