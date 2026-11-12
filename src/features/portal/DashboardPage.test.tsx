import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { envelope, renderPage } from '@/test/render'
import { DashboardPage } from './DashboardPage'
import type { AffiliateMe } from './api'

vi.mock('@/lib/auth', () => ({ userManager: { getUser: async () => ({ access_token: 'token' }) } }))
vi.mock('react-oidc-context', () => ({ useAuth: () => ({ signoutRedirect: vi.fn() }) }))
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,AAAA') } }))

const me: AffiliateMe = {
  proxy: 'AFST:P001:x',
  affiliateCode: 'JSMITH',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  referralUrl: 'https://mysolasta.com/?ref=JSMITH',
  bucksBalance: 2510,
  bucksEarnedThisMonth: 10,
  postsPending: 1,
  postsApproved: 1,
  memberSince: '2026-09-01T00:00:00Z',
}

afterEach(() => vi.unstubAllGlobals())

describe('DashboardPage', () => {
  it('shows the balance and referral link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(envelope(me)))
    renderPage(<DashboardPage />)

    expect(await screen.findByText('Hi Jane')).toBeInTheDocument()
    expect(screen.getByText('2,510')).toBeInTheDocument()
    expect(screen.getByDisplayValue(me.referralUrl)).toBeInTheDocument()
    expect(await screen.findByAltText(/qr code/i)).toBeInTheDocument()
  })

  it('explains a login whose affiliate account is gone', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })))
    renderPage(<DashboardPage />)

    expect(await screen.findByText('This is the affiliate portal')).toBeInTheDocument()
  })
})
