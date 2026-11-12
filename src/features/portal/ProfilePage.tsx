import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DetailList } from '@/components/DetailList'
import { ErrorPanel } from '@/components/ErrorPanel'
import { PageHeader } from '@/components/PageHeader'
import { NotAnAffiliate } from '@/components/RequireAffiliate'
import { LanguageSwitch } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/i18n'
import { ApiError } from '@/lib/api'
import { config } from '@/lib/config'
import { formatDate } from '@/lib/format'
import { useMe, useUpdateMe } from './api'

export function ProfilePage() {
  const { t } = useI18n()
  const me = useMe()
  const update = useUpdateMe()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (me.data) setPhone(me.data.phoneMobile ?? '')
  }, [me.data])

  if (me.error instanceof ApiError && me.error.status === 403) return <NotAnAffiliate />

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (phone.trim().length > 20) {
      setError(t('profile.phoneInvalid'))
      return
    }
    try {
      await update.mutateAsync({ phoneMobile: phone.trim() || null })
      toast.success(t('profile.saved'))
    } catch (e) {
      setError(e instanceof ApiError ? e.details.join(' ') : t('common.somethingWrong'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('profile.title')} description={t('profile.subtitle')} />
      {me.error ? (
        <ErrorPanel error={me.error} onRetry={() => void me.refetch()} />
      ) : !me.data ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <DetailList
                items={[
                  { label: t('profile.name'), value: `${me.data.firstName} ${me.data.lastName}` },
                  { label: t('profile.email'), value: me.data.email },
                  { label: t('profile.code'), value: <span className="font-mono">{me.data.affiliateCode}</span> },
                  { label: t('profile.memberSince'), value: formatDate(me.data.memberSince) },
                ]}
              />
              <p className="text-xs text-muted-foreground">{t('profile.emailHelp', { email: config.supportEmail })}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <form onSubmit={(e) => void save(e)} className="flex flex-col gap-3 sm:max-w-sm" noValidate>
                <Label htmlFor="phone">{t('profile.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                  value={phone}
                  aria-invalid={error !== null}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setError(null)
                  }}
                />
                {error ? <p className="text-sm text-red-300">{error}</p> : null}
                <Button type="submit" className="self-start" disabled={update.isPending}>
                  {update.isPending ? t('common.saving') : t('common.save')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('common.language')}</CardTitle>
            </CardHeader>
            <CardContent>
              <LanguageSwitch className="self-start inline-flex" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('profile.password')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t('profile.passwordHelp')}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
