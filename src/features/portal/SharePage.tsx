import { useState } from 'react'
import { ArrowSquareOut, PaperPlaneTilt, Plus, ShareNetwork } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { CopyField } from '@/components/CopyField'
import { ErrorPanel } from '@/components/ErrorPanel'
import { PageHeader } from '@/components/PageHeader'
import { NotAnAffiliate } from '@/components/RequireAffiliate'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/i18n'
import { ApiError } from '@/lib/api'
import { useCampaigns, useCreatePlacement, usePlatforms, type Campaign, type Placement, type Platform } from './api'
import { NewCampaignDialog } from './NewCampaignDialog'
import { PostDialog } from './PostDialog'
import { SolastaPosts } from './SolastaPosts'
import { StatusBadge } from './StatusBadge'
import { canNativeShare, nativeShare, shareUrl } from './share'

function PlacementRow({ placement, onPosted }: { placement: Placement; onPosted: (p: Placement) => void }) {
  const { t } = useI18n()
  const text = t('dashboard.shareText')
  const direct = shareUrl(placement.platformCode, placement.trackedUrl, text)

  return (
    <li className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{placement.platformName}</span>
        <StatusBadge placement={placement} />
      </div>
      {placement.reviewNote ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-sm">
          {t('links.sentBack', { reason: placement.reviewNote })}
        </p>
      ) : null}
      <CopyField value={placement.trackedUrl} label={t('links.copyLink')} />
      <div className="flex flex-wrap gap-2">
        {direct ? (
          <Button asChild size="sm" variant="outline">
            <a href={direct} target="_blank" rel="noopener noreferrer">
              <ShareNetwork />
              {t('links.shareOn', { platform: placement.platformName })}
            </a>
          </Button>
        ) : canNativeShare() ? (
          <Button size="sm" variant="outline" onClick={() => void nativeShare(placement.trackedUrl, text, t('app.name'))}>
            <ShareNetwork />
            {t('dashboard.share')}
          </Button>
        ) : null}
        {placement.postStatus !== 'Approved' ? (
          <Button size="sm" variant={placement.postStatus === 'NotPosted' ? 'default' : 'ghost'} onClick={() => onPosted(placement)}>
            <PaperPlaneTilt />
            {placement.postStatus === 'NotPosted' ? t('links.iPosted') : t('links.editPost')}
          </Button>
        ) : null}
        {placement.postUrl ? (
          <Button asChild size="sm" variant="ghost">
            <a href={placement.postUrl} target="_blank" rel="noopener noreferrer">
              <ArrowSquareOut />
              {t('links.viewPost')}
            </a>
          </Button>
        ) : null}
      </div>
    </li>
  )
}

function CampaignCard({
  campaign,
  platforms,
  onPosted,
}: {
  campaign: Campaign
  platforms: Platform[]
  onPosted: (p: Placement) => void
}) {
  const { t } = useI18n()
  const create = useCreatePlacement()
  const used = new Set(campaign.placements.map((p) => p.platformCode))
  const available = platforms.filter((p) => !used.has(p.code))

  const add = async (platformCode: string) => {
    try {
      await create.mutateAsync({ campaignId: campaign.id, platformCode })
    } catch (e) {
      toast.error(e instanceof ApiError ? e.details.join(' ') : t('common.somethingWrong'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{campaign.name}</CardTitle>
        {campaign.description ? <CardDescription>{campaign.description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {campaign.placements.length === 0 ? <p className="text-sm text-muted-foreground">{t('links.noLinks')}</p> : null}
        {campaign.placements.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {campaign.placements.map((p) => (
              <PlacementRow key={p.trackingToken} placement={p} onPosted={onPosted} />
            ))}
          </ul>
        ) : null}
        {available.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{t('links.addPlatform')}</span>
            <div className="flex flex-wrap gap-2">
              {available.map((p) => (
                <Button
                  key={p.code}
                  size="sm"
                  variant="secondary"
                  disabled={create.isPending}
                  onClick={() => void add(p.code)}
                >
                  <Plus />
                  {p.name}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function SharePage() {
  const { t } = useI18n()
  const campaigns = useCampaigns()
  const platforms = usePlatforms()
  const [posting, setPosting] = useState<Placement | null>(null)

  const error = campaigns.error ?? platforms.error
  if (error instanceof ApiError && error.status === 403) return <NotAnAffiliate />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('links.title')}
        description={t('links.subtitle')}
        actions={campaigns.data && campaigns.data.length > 0 ? <NewCampaignDialog /> : null}
      />
      <SolastaPosts onPosted={setPosting} />
      <h2 className="text-lg font-semibold">{t('links.myCampaigns')}</h2>
      {error ? (
        <ErrorPanel
          error={error}
          onRetry={() => {
            void campaigns.refetch()
            void platforms.refetch()
          }}
        />
      ) : !campaigns.data || !platforms.data ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : campaigns.data.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('links.noCampaignsTitle')}</CardTitle>
            <CardDescription>{t('links.noCampaignsBody')}</CardDescription>
          </CardHeader>
          <CardContent>
            <NewCampaignDialog />
          </CardContent>
        </Card>
      ) : (
        campaigns.data.map((c) => <CampaignCard key={c.id} campaign={c} platforms={platforms.data} onPosted={setPosting} />)
      )}
      <PostDialog placement={posting} onClose={() => setPosting(null)} />
    </div>
  )
}
