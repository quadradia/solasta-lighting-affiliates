import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'
import { ApiError } from '@/lib/api'
import { useSubmitPost, type Placement } from './api'
import { isPostUrl } from './share'

/** "I posted it": the affiliate pastes the link to their post so staff can approve the reward. */
export function PostDialog({ placement, onClose }: { placement: Placement | null; onClose: () => void }) {
  const { t } = useI18n()
  const submit = useSubmitPost()
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setUrl(placement?.postUrl ?? '')
    setError(null)
  }, [placement])

  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!placement) return
    if (!isPostUrl(url)) {
      setError(t('links.postUrlInvalid'))
      return
    }
    try {
      await submit.mutateAsync({ trackingToken: placement.trackingToken, postUrl: url.trim() })
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
            <DialogTitle>{t('links.postDialogTitle')}</DialogTitle>
            <DialogDescription>{t('links.postDialogBody', { platform: placement?.platformName ?? '' })}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="post-url">{t('links.postUrl')}</Label>
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
