import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/i18n'
import { ApiError } from '@/lib/api'
import { useCreateCampaign } from './api'

export function NewCampaignDialog({ variant = 'default' }: { variant?: 'default' | 'outline' }) {
  const { t } = useI18n()
  const create = useCreateCampaign()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setError(t('links.campaignName'))
      return
    }
    try {
      await create.mutateAsync({ name: name.trim(), description: description.trim() || undefined })
      toast.success(t('links.created'))
      setOpen(false)
      setName('')
      setDescription('')
    } catch (e) {
      setError(e instanceof ApiError ? e.details.join(' ') : t('common.somethingWrong'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Plus />
          {t('links.newCampaign')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>{t('links.newCampaign')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="campaign-name">{t('links.campaignName')}</Label>
            <Input
              id="campaign-name"
              maxLength={200}
              placeholder={t('links.campaignNamePlaceholder')}
              value={name}
              aria-invalid={error !== null}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
            />
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="campaign-description">{t('links.campaignDescription')}</Label>
            <Textarea
              id="campaign-description"
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t('common.saving') : t('links.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
