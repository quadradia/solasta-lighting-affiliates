import { useEffect } from 'react'
import { useI18n } from '@/i18n'
import { applyAccentColor } from './theme'
import { useBranding, useLogoUrl } from './api'

/** Applies the tenant's accent color and the portal's tab title while the portal is open. */
export function useTenantTheme() {
  const { data } = useBranding()
  const { t } = useI18n()
  useEffect(() => {
    applyAccentColor(data?.primaryColor)
    document.title = t('app.name')
  }, [data?.primaryColor, t])
}

/** The tenant's logo with the portal name. */
export function BrandMark() {
  const { data } = useBranding()
  const logoUrl = useLogoUrl(data)
  const { t } = useI18n()

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <img src={logoUrl} alt="" className="size-8 shrink-0 object-contain" />
      <span className="truncate font-[family-name:var(--font-heading)] text-lg font-semibold">{t('app.name')}</span>
    </div>
  )
}
