import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowSquareOut, ChatCircleText, ClipboardText, FacebookLogo, InstagramLogo } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'
import { ApiError } from '@/lib/api'
import { useSubmitPost, type Placement } from './api'
import { canReadClipboard, normalizePostUrl, platformHome } from './share'

function PlatformIcon({ code }: { code: string }) {
  if (code === 'IG') return <InstagramLogo weight="fill" />
  if (code === 'FB') return <FacebookLogo weight="fill" />
  return <ChatCircleText />
}

/** The "Copy link" steps differ per app, so each platform gets its own second step. */
function copyStepKey(code: string) {
  if (code === 'IG') return 'links.howTo.copyIG' as const
  if (code === 'FB') return 'links.howTo.copyFB' as const
  return 'links.howTo.copyOther' as const
}

/**
 * "I posted it": the affiliate gives us the link to their post so staff can approve the reward.
 * Most people have never copied a post link, so the dialog shows how to do it in their app,
 * offers a Paste button, and accepts links pasted with extra text or without https://.
 */
export function PostDialog({ placement, onClose }: { placement: Placement | null; onClose: () => void }) {
  const { t } = useI18n()
  const submit = useSubmitPost()
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const code = placement?.platformCode.toUpperCase() ?? ''
  const platform = placement?.platformName ?? ''
  const home = platformHome(code)

  useEffect(() => {
    setUrl(placement?.postUrl ?? '')
    setError(null)
  }, [placement])

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const found = normalizePostUrl(text)
      if (found) {
        setUrl(found)
        setError(null)
      } else {
        setError(t('links.pasteNothing'))
      }
    } catch {
      setError(t('links.pasteBlocked'))
    }
  }

  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!placement) return
    const postUrl = normalizePostUrl(url)
    if (!postUrl) {
      setError(t('links.postUrlInvalid'))
      return
    }
    setUrl(postUrl)
    try {
      await submit.mutateAsync({ trackingToken: placement.trackingToken, postUrl })
      toast.success(t('links.submitted'))
      onClose()
    } catch (e) {
      setError(e instanceof ApiError ? e.details.join(' ') : t('common.somethingWrong'))
    }
  }

  return (
    <Dialog open={placement !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <form onSubmit={(e) => void send(e)} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 sm:justify-start">
              <PlatformIcon code={code} />
              {t('links.postDialogTitle', { platform })}
            </DialogTitle>
            <DialogDescription>{t('links.postDialogBody', { platform })}</DialogDescription>
          </DialogHeader>

          <ol className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
            {[t('links.howTo.open', { platform }), t(copyStepKey(code)), t('links.howTo.paste')].map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
            {home ? (
              <li className="pl-7">
                <a
                  href={home}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {t('links.openPlatform', { platform })}
                  <ArrowSquareOut className="size-3" />
                </a>
              </li>
            ) : null}
          </ol>

          <div className="flex flex-col gap-2">
            <Label htmlFor="post-url">{t('links.postUrl')}</Label>
            <div className="flex gap-2">
              <Input
                id="post-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder={t('links.postUrlPlaceholder')}
                value={url}
                aria-invalid={error !== null}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError(null)
                }}
              />
              {canReadClipboard() ? (
                <Button type="button" variant="secondary" onClick={() => void paste()}>
                  <ClipboardText />
                  {t('links.paste')}
                </Button>
              ) : null}
            </div>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending ? t('common.saving') : t('links.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
