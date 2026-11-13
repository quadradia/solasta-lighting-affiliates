import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { envelope, renderPage } from '@/test/render'
import { SharePage } from './SharePage'
import type { Placement, Platform, SocialPost } from './api'

vi.mock('@/lib/auth', () => ({ userManager: { getUser: async () => ({ access_token: 'token' }) } }))

const platforms: Platform[] = [
  { id: 2, name: 'Facebook', code: 'FB' },
  { id: 3, name: 'Instagram', code: 'IG' },
]
const post: SocialPost = {
  id: 501,
  platformCode: 'FB',
  platformName: 'Facebook',
  permalink: 'https://www.facebook.com/solasta/posts/1',
  postedDate: '2026-11-10T15:00:00Z',
  shareCaptionEn: 'Our lights on a Phoenix home!',
  shareCaptionEs: '¡Nuestras luces en una casa de Phoenix!',
  caption: 'Original caption',
  previewUrl: 'https://scontent.fbcdn.net/a.jpg',
  mediaCount: 1,
  hasVideo: false,
  placements: [],
}
const fbLink: Placement = {
  trackingToken: 'AFL-FB-00043',
  campaignId: 9,
  platformCode: 'FB',
  platformName: 'Facebook',
  trackedUrl: 'https://mysolasta.com/?ref=JSMITH&t=AFL-FB-00043',
  postStatus: 'NotPosted',
  socialPostId: 501,
  createdDate: '2026-11-12T10:00:00Z',
}

function api(handlers: Record<string, (init: RequestInit) => Response>) {
  return vi.fn(async (url: string, init: RequestInit = {}) => {
    const path = new URL(url).pathname
    const handler = handlers[`${init.method ?? 'GET'} ${path}`]
    if (!handler) throw new Error(`Unexpected ${init.method ?? 'GET'} ${path}`)
    return handler(init)
  })
}

const base = {
  'GET /api/affiliate/me/campaigns': () => envelope([]),
  'GET /api/affiliate/platforms': () => envelope(platforms),
}

afterEach(() => vi.unstubAllGlobals())

describe('Solasta posts', () => {
  it('shows the caption in my language', async () => {
    vi.stubGlobal('fetch', api({ ...base, 'GET /api/affiliate/me/social-posts': () => envelope([post]) }))
    renderPage(<SharePage />, { language: 'es' })

    expect(await screen.findByText('¡Nuestras luces en una casa de Phoenix!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compartir en Instagram' })).toBeInTheDocument()
  })

  it('makes a Facebook link and offers my link and the original post', async () => {
    const fetch = api({
      ...base,
      'GET /api/affiliate/me/social-posts': () => envelope([post]),
      'POST /api/affiliate/me/social-posts/501/share': () => envelope({ ...post, placements: [fbLink] }),
    })
    vi.stubGlobal('fetch', fetch)
    renderPage(<SharePage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Share on Facebook' }))

    const mine = await screen.findByRole('link', { name: /share with my link/i })
    expect(mine).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(fbLink.trackedUrl)))
    expect(screen.getByRole('link', { name: /share solasta's post/i })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent(post.permalink!)),
    )
    const share = fetch.mock.calls.find(([, init]) => init?.method === 'POST')!
    expect(JSON.parse(share[1]!.body as string)).toEqual({ platformCode: 'FB' })
    // Facebook is taken, so only Instagram is left to start.
    expect(screen.queryByRole('button', { name: 'Share on Facebook' })).not.toBeInTheDocument()
  })

  it('gets the photo for Instagram and saves it without a share sheet', async () => {
    const igLink: Placement = { ...fbLink, trackingToken: 'AFL-IG-00044', platformCode: 'IG', platformName: 'Instagram' }
    const fetch = api({
      ...base,
      'GET /api/affiliate/me/social-posts': () => envelope([{ ...post, placements: [igLink] }]),
      'GET /api/affiliate/me/social-posts/501/media/0': () => new Response(new Blob(['jpg'], { type: 'image/jpeg' })),
    })
    vi.stubGlobal('fetch', fetch)
    const createObjectURL = vi.fn(() => 'blob:x')
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }))
    renderPage(<SharePage />)

    await userEvent.click(await screen.findByRole('button', { name: /get photos \(1\)/i }))
    await userEvent.click(await screen.findByRole('button', { name: /save to device/i }))

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const media = fetch.mock.calls.find(([url]) => String(url).includes('/media/0'))!
    expect((media[1]!.headers as Record<string, string>).Authorization).toBe('Bearer token')
  })

  it('shows why staff sent a post back', async () => {
    vi.stubGlobal(
      'fetch',
      api({
        ...base,
        'GET /api/affiliate/me/social-posts': () =>
          envelope([{ ...post, placements: [{ ...fbLink, reviewNote: 'The post is private.' }] }]),
      }),
    )
    renderPage(<SharePage />)

    const card = (await screen.findByText(/the post is private/i)).closest('li')!
    expect(within(card).getByText(/sent back/i)).toBeInTheDocument()
  })

  it('submitting a post for a Solasta post updates it in place', async () => {
    const fetch = api({
      ...base,
      'GET /api/affiliate/me/social-posts': () => envelope([{ ...post, placements: [fbLink] }]),
      'PUT /api/affiliate/me/placements/AFL-FB-00043/post': () =>
        envelope({ ...fbLink, postUrl: 'https://facebook.com/jane/posts/9', postStatus: 'Pending' }),
      'GET /api/affiliate/me': () => envelope({}),
    })
    vi.stubGlobal('fetch', fetch)
    renderPage(<SharePage />)

    await userEvent.click(await screen.findByRole('button', { name: /i posted it/i }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/link to your post/i), 'https://facebook.com/jane/posts/9')
    await userEvent.click(within(dialog).getByRole('button', { name: /send for review/i }))

    await waitFor(() => expect(screen.getByText('In review')).toBeInTheDocument())
  })
})
