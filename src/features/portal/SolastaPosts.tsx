import { useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowSquareOut,
  ChatCircleText,
  DownloadSimple,
  FacebookLogo,
  ImageSquare,
  InstagramLogo,
  PaperPlaneTilt,
  ShareNetwork,
  Stack,
  FilmStrip,
} from '@phosphor-icons/react'
import { ErrorPanel } from '@/components/ErrorPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/i18n'
import { ApiError, apiFetchBlob } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { socialMediaPath, useShareSocialPost, useSocialPosts, type Placement, type SocialPost } from './api'
import { canShareFiles, captionWithLink, copyText, saveFile, shareFiles, shareUrl } from './share'
import { StatusBadge } from './StatusBadge'

/** Where affiliates can reshare Solasta's posts, for now. */
const SHARE_PLATFORMS = [
  { code: 'FB', name: 'Facebook', icon: FacebookLogo },
  { code: 'IG', name: 'Instagram', icon: InstagramLogo },
] as const

function useCaption(post: SocialPost) {
  const { language } = useI18n()
  const own = language === 'es' ? (post.shareCaptionEs ?? post.shareCaptionEn) : post.shareCaptionEn
  return own?.trim() || post.caption?.trim() || ''
}

function PlatformIcon({ code }: { code: string }) {
  if (code === 'IG') return <InstagramLogo weight="fill" />
  if (code === 'FB') return <FacebookLogo weight="fill" />
  return <ChatCircleText />
}

/**
 * Instagram cannot take a link to someone else's post, so the affiliate gets the picture or video itself.
 * Phones open the share sheet with the file (pick Instagram there); the caption is copied first because
 * Instagram ignores shared text. Elsewhere the files download.
 */
function MediaActions({ post, caption }: { post: SocialPost; caption: string }) {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[] | null>(null)
  const [loading, setLoading] = useState(false)
  const count = Math.max(1, post.mediaCount)

  const load = async () => {
    setLoading(true)
    try {
      const blobs = await Promise.all(Array.from({ length: count }, (_, i) => apiFetchBlob(socialMediaPath(post.id, i))))
      const loaded = blobs.flatMap((blob, i) => {
        if (!blob) return []
        const video = blob.type.startsWith('video/')
        const suffix = count > 1 ? `-${i + 1}` : ''
        return [new File([blob], `solasta-${post.id}${suffix}.${video ? 'mp4' : 'jpg'}`, { type: blob.type || 'image/jpeg' })]
      })
      if (loaded.length === 0) throw new Error('empty')
      setFiles(loaded)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('solasta.mediaFailed'))
    } finally {
      setLoading(false)
    }
  }

  const openShareSheet = async (ready: File[]) => {
    const copied = await copyText(caption)
    if (copied) toast.success(t('solasta.captionCopied'))
    await shareFiles(ready, t('app.name'))
  }

  if (!files)
    return (
      <Button size="sm" variant="outline" disabled={loading} onClick={() => void load()}>
        <DownloadSimple />
        {loading ? t('common.loading') : post.hasVideo ? t('solasta.getVideo') : t('solasta.getPhoto', { count })}
      </Button>
    )

  return (
    <>
      {canShareFiles(files) ? (
        <Button size="sm" onClick={() => void openShareSheet(files)}>
          <InstagramLogo />
          {t('solasta.openInstagram')}
        </Button>
      ) : null}
      <Button size="sm" variant="outline" onClick={() => files.forEach(saveFile)}>
        <DownloadSimple />
        {t('solasta.save')}
      </Button>
    </>
  )
}

function SocialLinkRow({
  post,
  placement,
  caption,
  onPosted,
}: {
  post: SocialPost
  placement: Placement
  caption: string
  onPosted: (p: Placement) => void
}) {
  const { t } = useI18n()
  const text = captionWithLink(caption, placement.trackedUrl)

  const copyCaption = async () => {
    if (await copyText(text)) toast.success(t('solasta.captionCopied'))
    else toast.error(t('common.copyFailed'))
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-medium">
          <PlatformIcon code={placement.platformCode} />
          {placement.platformName}
        </span>
        <StatusBadge placement={placement} />
      </div>
      {placement.reviewNote ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-sm">
          {t('links.sentBack', { reason: placement.reviewNote })}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {placement.platformCode === 'FB' ? (
          <>
            <Button asChild size="sm">
              <a href={shareUrl('FB', placement.trackedUrl, text) ?? '#'} target="_blank" rel="noopener noreferrer">
                <ShareNetwork />
                {t('solasta.shareMyLink')}
              </a>
            </Button>
            {post.platformCode === 'FB' && post.permalink ? (
              <Button asChild size="sm" variant="outline">
                <a href={shareUrl('FB', post.permalink, text) ?? '#'} target="_blank" rel="noopener noreferrer">
                  <FacebookLogo />
                  {t('solasta.shareOriginal')}
                </a>
              </Button>
            ) : null}
          </>
        ) : (
          <MediaActions post={post} caption={text} />
        )}
        <Button size="sm" variant="outline" onClick={() => void copyCaption()}>
          <ChatCircleText />
          {t('solasta.copyCaption')}
        </Button>
        {placement.postStatus !== 'Approved' ? (
          <Button size="sm" variant={placement.postStatus === 'NotPosted' ? 'secondary' : 'ghost'} onClick={() => onPosted(placement)}>
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

function SolastaPostCard({ post, onPosted }: { post: SocialPost; onPosted: (p: Placement) => void }) {
  const { t } = useI18n()
  const caption = useCaption(post)
  const share = useShareSocialPost()
  const used = new Set(post.placements.map((p) => p.platformCode))

  const start = async (platformCode: string) => {
    try {
      await share.mutateAsync({ postId: post.id, platformCode })
    } catch (e) {
      toast.error(e instanceof ApiError ? e.details.join(' ') : t('common.somethingWrong'))
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square bg-muted sm:aspect-[4/3]">
        {post.previewUrl ? (
          <img
            src={post.previewUrl}
            alt={t('solasta.imageAlt', { platform: post.platformName })}
            className="size-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageSquare className="size-10" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          <Badge variant="secondary" className="gap-1">
            <PlatformIcon code={post.platformCode} />
            {post.platformName}
          </Badge>
          {post.mediaCount > 1 ? (
            <Badge variant="secondary" className="gap-1">
              <Stack />
              {post.mediaCount}
            </Badge>
          ) : post.hasVideo ? (
            <Badge variant="secondary" className="gap-1">
              <FilmStrip />
              {t('solasta.video')}
            </Badge>
          ) : null}
        </div>
      </div>
      <CardContent className="flex flex-col gap-3 pt-4">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{formatDate(post.postedDate)}</span>
          {post.permalink ? (
            <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
              {t('solasta.viewOriginal')}
              <ArrowSquareOut className="size-3" />
            </a>
          ) : null}
        </div>
        {caption ? <p className="line-clamp-4 whitespace-pre-line text-sm">{caption}</p> : null}

        {post.placements.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {post.placements.map((p) => (
              <SocialLinkRow key={p.trackingToken} post={post} placement={p} caption={caption} onPosted={onPosted} />
            ))}
          </ul>
        ) : null}

        {SHARE_PLATFORMS.some((p) => !used.has(p.code)) ? (
          <div className="flex flex-wrap gap-2">
            {SHARE_PLATFORMS.filter((p) => !used.has(p.code)).map(({ code, name, icon: Icon }) => (
              <Button
                key={code}
                size="sm"
                variant={post.placements.length === 0 ? 'default' : 'secondary'}
                disabled={share.isPending}
                onClick={() => void start(code)}
              >
                <Icon />
                {t('links.shareOn', { platform: name })}
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** Solasta's own Facebook and Instagram posts, ready to reshare with the affiliate's tracked link. */
export function SolastaPosts({ onPosted }: { onPosted: (p: Placement) => void }) {
  const { t } = useI18n()
  const posts = useSocialPosts()

  return (
    <section aria-labelledby="solasta-posts" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="solasta-posts" className="text-lg font-semibold">
          {t('solasta.title')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('solasta.subtitle')}</p>
      </div>
      {posts.isError ? (
        posts.error instanceof ApiError && posts.error.status === 403 ? null : (
          <ErrorPanel error={posts.error} onRetry={() => void posts.refetch()} />
        )
      ) : posts.isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : posts.data.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t('solasta.empty')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.data.map((p) => (
            <SolastaPostCard key={p.id} post={p} onPosted={onPosted} />
          ))}
        </div>
      )}
    </section>
  )
}
