import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { envelope, renderPage } from '@/test/render'
import { SharePage } from './SharePage'
import type { Campaign, Placement, Platform } from './api'

vi.mock('@/lib/auth', () => ({ userManager: { getUser: async () => ({ access_token: 'token' }) } }))

const platforms: Platform[] = [
  { id: 2, name: 'Facebook', code: 'FB' },
  { id: 3, name: 'Instagram', code: 'IG' },
]
const link: Placement = {
  trackingToken: 'AFL-FB-00042',
  campaignId: 7,
  platformCode: 'FB',
  platformName: 'Facebook',
  trackedUrl: 'https://mysolasta.com/?ref=JSMITH&t=AFL-FB-00042',
  postStatus: 'NotPosted',
  createdDate: '2026-11-10T10:00:00Z',
}
const campaign: Campaign = { id: 7, name: 'Holiday lights', createdDate: '2026-11-10T10:00:00Z', placements: [link] }

/** Answers by URL so the order of the page's parallel queries does not matter. */
function api(handlers: Record<string, (init: RequestInit) => Response>) {
  return vi.fn(async (url: string, init: RequestInit) => {
    const path = new URL(url).pathname
    const handler = handlers[`${init.method ?? 'GET'} ${path}`]
    if (!handler) throw new Error(`Unexpected ${init.method ?? 'GET'} ${path}`)
    return handler(init)
  })
}

afterEach(() => vi.unstubAllGlobals())

describe('SharePage', () => {
  it('shows tracked links with a direct share for Facebook', async () => {
    vi.stubGlobal('fetch', api({
      'GET /api/affiliate/me/campaigns': () => envelope([campaign]),
      'GET /api/affiliate/platforms': () => envelope(platforms),
    }))
    renderPage(<SharePage />)

    expect(await screen.findByText('Holiday lights')).toBeInTheDocument()
    expect(screen.getByDisplayValue(link.trackedUrl)).toBeInTheDocument()
    const share = screen.getByRole('link', { name: /share on facebook/i })
    expect(share).toHaveAttribute('href', expect.stringContaining('facebook.com/sharer'))
    expect(share).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(link.trackedUrl)))
    // Facebook already has a link, so only Instagram is offered.
    expect(screen.getByRole('button', { name: 'Instagram' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Facebook' })).not.toBeInTheDocument()
  })

  it('submits the post link and shows it in review', async () => {
    const fetch = api({
      'GET /api/affiliate/me/campaigns': () => envelope([campaign]),
      'GET /api/affiliate/platforms': () => envelope(platforms),
      'PUT /api/affiliate/me/placements/AFL-FB-00042/post': () =>
        envelope({ ...link, postUrl: 'https://facebook.com/p/1', postStatus: 'Pending' }),
      'GET /api/affiliate/me': () => envelope({}),
    })
    vi.stubGlobal('fetch', fetch)
    renderPage(<SharePage />)

    await userEvent.click(await screen.findByRole('button', { name: /i posted it/i }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/link to your post/i), 'facebook.com/p/1')
    await userEvent.click(within(dialog).getByRole('button', { name: /send for review/i }))
    expect(await within(dialog).findByText(/starting with https/i)).toBeInTheDocument()

    await userEvent.clear(within(dialog).getByLabelText(/link to your post/i))
    await userEvent.type(within(dialog).getByLabelText(/link to your post/i), 'https://facebook.com/p/1')
    await userEvent.click(within(dialog).getByRole('button', { name: /send for review/i }))

    await waitFor(() => expect(screen.getByText('In review')).toBeInTheDocument())
    const put = fetch.mock.calls.find(([, init]) => init.method === 'PUT')!
    expect(JSON.parse(put[1].body as string)).toEqual({ postUrl: 'https://facebook.com/p/1' })
  })

  it('creates a link for another platform', async () => {
    const fetch = api({
      'GET /api/affiliate/me/campaigns': () => envelope([campaign]),
      'GET /api/affiliate/platforms': () => envelope(platforms),
      'POST /api/affiliate/me/campaigns/7/placements': () =>
        envelope({ ...link, trackingToken: 'AFL-IG-00043', platformCode: 'IG', platformName: 'Instagram', trackedUrl: 'https://mysolasta.com/?ref=JSMITH&t=AFL-IG-00043' }),
    })
    vi.stubGlobal('fetch', fetch)
    renderPage(<SharePage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Instagram' }))

    expect(await screen.findByDisplayValue('https://mysolasta.com/?ref=JSMITH&t=AFL-IG-00043')).toBeInTheDocument()
    const post = fetch.mock.calls.find(([, init]) => init.method === 'POST')!
    expect(JSON.parse(post[1].body as string)).toEqual({ platformCode: 'IG' })
  })

  it('invites a new affiliate to start a campaign', async () => {
    vi.stubGlobal('fetch', api({
      'GET /api/affiliate/me/campaigns': () => envelope([]),
      'GET /api/affiliate/platforms': () => envelope(platforms),
    }))
    renderPage(<SharePage />, { language: 'es' })

    expect(await screen.findByText('Crea tu primera campaña')).toBeInTheDocument()
  })
})
