import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LanguageProvider } from '@/i18n'
import { RequireAffiliate } from './RequireAffiliate'

const auth = vi.hoisted(() => ({
  isLoading: false,
  isAuthenticated: false,
  activeNavigator: undefined as string | undefined,
  error: undefined as Error | undefined,
  user: null as unknown,
  signinRedirect: vi.fn().mockResolvedValue(undefined),
  signoutRedirect: vi.fn(),
}))
vi.mock('react-oidc-context', () => ({ useAuth: () => auth }))
vi.mock('@/lib/auth', () => ({
  isAffiliate: (user: { roles?: string[] } | null) => !!user?.roles?.includes('affiliate'),
}))

function renderGuard(language: 'en' | 'es' = 'en') {
  return render(
    <LanguageProvider initial={language}>
      <MemoryRouter initialEntries={['/earnings?page=2']}>
        <RequireAffiliate>
          <p>portal page</p>
        </RequireAffiliate>
      </MemoryRouter>
    </LanguageProvider>,
  )
}

describe('RequireAffiliate', () => {
  beforeEach(() => {
    Object.assign(auth, { isAuthenticated: false, user: null, error: undefined })
    auth.signinRedirect.mockClear()
  })

  it('sends signed-out visitors to sign in and remembers the page', () => {
    renderGuard()
    expect(auth.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/earnings?page=2' } })
    expect(screen.queryByText('portal page')).not.toBeInTheDocument()
  })

  it('shows the portal to affiliates', () => {
    Object.assign(auth, { isAuthenticated: true, user: { roles: ['affiliate'] } })
    renderGuard()
    expect(screen.getByText('portal page')).toBeInTheDocument()
  })

  it('explains the portal to other logins, in their language', () => {
    Object.assign(auth, { isAuthenticated: true, user: { roles: ['staff'] } })
    renderGuard('es')
    expect(screen.getByText('Este es el portal de afiliados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quiero ser afiliado' })).toBeInTheDocument()
    expect(screen.queryByText('portal page')).not.toBeInTheDocument()
  })
})
