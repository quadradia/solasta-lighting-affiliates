import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { useAuth } from 'react-oidc-context'
import { useI18n } from '@/i18n'
import { isAffiliate } from '@/lib/auth'
import { config } from '@/lib/config'
import { FullPageMessage } from '@/pages/FullPageMessage'

/** Public page where people apply to the affiliate program. */
export const APPLY_URL = 'https://mysolasta.com/affiliate'

/**
 * Sends signed-out visitors to the Identity Server login, remembering where they were going, and
 * explains the portal to signed-in users without the affiliate role. The API enforces the same rule.
 */
export function RequireAffiliate({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const location = useLocation()
  const { t } = useI18n()
  const needsLogin = !auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator && !auth.error

  useEffect(() => {
    if (needsLogin) {
      void auth.signinRedirect({ state: { returnTo: location.pathname + location.search } })
    }
  }, [needsLogin, auth, location.pathname, location.search])

  if (auth.error) {
    return (
      <FullPageMessage
        title={t('auth.failed')}
        message={auth.error.message}
        action={{ label: t('common.tryAgain'), onClick: () => void auth.signinRedirect() }}
      />
    )
  }
  if (!auth.isAuthenticated) return <FullPageMessage title={t('auth.signingIn')} />
  if (!isAffiliate(auth.user)) return <NotAnAffiliate />
  return <>{children}</>
}

/** A signed-in login that is not (or no longer) an affiliate. */
export function NotAnAffiliate() {
  const auth = useAuth()
  const { t } = useI18n()
  return (
    <FullPageMessage
      title={t('auth.notAffiliateTitle')}
      message={t('auth.notAffiliateBody', { email: config.supportEmail })}
      action={{ label: t('auth.apply'), onClick: () => window.location.assign(APPLY_URL) }}
      secondaryAction={{ label: t('auth.switchAccount'), onClick: () => void auth.signoutRedirect() }}
    />
  )
}
