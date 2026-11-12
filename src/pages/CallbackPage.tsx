import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from 'react-oidc-context'
import { useI18n } from '@/i18n'
import { FullPageMessage } from './FullPageMessage'

/** Where the Identity Server sends affiliates back; AuthProvider exchanges the code, then we go on. */
export function CallbackPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()

  useEffect(() => {
    if (auth.isAuthenticated) {
      const state = auth.user?.state as { returnTo?: string } | undefined
      const returnTo = state?.returnTo?.startsWith('/') && !state.returnTo.startsWith('//') ? state.returnTo : '/'
      navigate(returnTo, { replace: true })
    }
  }, [auth.isAuthenticated, auth.user, navigate])

  if (auth.error) {
    return (
      <FullPageMessage
        title={t('auth.failed')}
        message={auth.error.message}
        action={{ label: t('common.tryAgain'), onClick: () => void auth.signinRedirect() }}
      />
    )
  }
  return <FullPageMessage title={t('auth.signingIn')} />
}
