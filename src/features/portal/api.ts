import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

// Types mirror the Solasta API's AffiliatePortalDto.cs (api/affiliate/...). The API resolves the affiliate
// from the access token, so no call here sends an affiliate id.

export type PostStatus = 'NotPosted' | 'Pending' | 'Approved'

export interface AffiliateMe {
  proxy: string
  affiliateCode: string
  firstName: string
  lastName: string
  email: string
  phoneMobile?: string | null
  referralUrl: string
  bucksBalance: number
  bucksEarnedThisMonth: number
  postsPending: number
  postsApproved: number
  memberSince: string
}

export interface BucksEntry {
  proxy: string
  transactionDate: string
  /** AFBP post reward, AFBR referral reward, AFBD redemption, AFBA adjustment. */
  typeCode: string
  typeName: string
  amount: number
  description?: string | null
  sourceProxy?: string | null
}

export interface BucksPage {
  items: BucksEntry[]
  totalCount: number
  page: number
  pageSize: number
  balance: number
}

export interface Platform {
  id: number
  name: string
  code: string
  iconUrl?: string | null
}

export interface Placement {
  trackingToken: string
  campaignId: number
  platformCode: string
  platformName: string
  trackedUrl: string
  postUrl?: string | null
  postedDate?: string | null
  postStatus: PostStatus
  rewardBucks?: number | null
  /** Why staff sent the last post back, when they did. */
  reviewNote?: string | null
  /** The Solasta post this link was made for; null for a link of the affiliate's own campaign. */
  socialPostId?: number | null
  createdDate: string
}

/** A Solasta Facebook or Instagram post that staff shared with affiliates (AffiliateSocialPostDto). */
export interface SocialPost {
  id: number
  /** Where Solasta posted it: FB or IG. */
  platformCode: string
  platformName: string
  permalink?: string | null
  mediaType?: string | null
  postedDate: string
  shareCaptionEn?: string | null
  shareCaptionEs?: string | null
  /** Solasta's original caption, used when staff wrote no caption for affiliates. */
  caption?: string | null
  /** Straight from Meta's CDN; expires after a few hours. */
  previewUrl?: string | null
  mediaCount: number
  hasVideo: boolean
  /** My tracked links for this post, one per platform I chose. */
  placements: Placement[]
}

export interface Campaign {
  id: number
  name: string
  description?: string | null
  startDate?: string | null
  endDate?: string | null
  createdDate: string
  placements: Placement[]
}

export const keys = {
  me: ['affiliate', 'me'] as const,
  bucks: (page: number) => ['affiliate', 'bucks', page] as const,
  campaigns: ['affiliate', 'campaigns'] as const,
  platforms: ['affiliate', 'platforms'] as const,
  socialPosts: ['affiliate', 'social-posts'] as const,
}

export function useMe() {
  return useQuery({ queryKey: keys.me, queryFn: ({ signal }) => apiFetch<AffiliateMe>('api/affiliate/me', { signal }) })
}

export function useBucks(page: number, pageSize = 20) {
  return useQuery({
    queryKey: keys.bucks(page),
    queryFn: ({ signal }) => apiFetch<BucksPage>('api/affiliate/me/bucks', { signal, query: { page, pageSize } }),
    placeholderData: (previous) => previous,
  })
}

export function useCampaigns() {
  return useQuery({
    queryKey: keys.campaigns,
    queryFn: ({ signal }) => apiFetch<Campaign[]>('api/affiliate/me/campaigns', { signal }),
  })
}

export function usePlatforms() {
  return useQuery({
    queryKey: keys.platforms,
    queryFn: ({ signal }) => apiFetch<Platform[]>('api/affiliate/platforms', { signal }),
    staleTime: 60 * 60_000,
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: { phoneMobile: string | null }) =>
      apiFetch<AffiliateMe>('api/affiliate/me', { method: 'PUT', body: values }),
    onSuccess: (me) => queryClient.setQueryData(keys.me, me),
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: { name: string; description?: string }) =>
      apiFetch<Campaign>('api/affiliate/me/campaigns', { method: 'POST', body: values }),
    onSuccess: (campaign) =>
      queryClient.setQueryData<Campaign[]>(keys.campaigns, (list) => [campaign, ...(list ?? [])]),
  })
}

function replacePlacement(list: Campaign[] | undefined, placement: Placement): Campaign[] | undefined {
  return list?.map((c) =>
    c.id !== placement.campaignId
      ? c
      : {
          ...c,
          placements: c.placements.some((p) => p.trackingToken === placement.trackingToken)
            ? c.placements.map((p) => (p.trackingToken === placement.trackingToken ? placement : p))
            : [...c.placements, placement],
        },
  )
}

export function useCreatePlacement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ campaignId, platformCode }: { campaignId: number; platformCode: string }) =>
      apiFetch<Placement>(`api/affiliate/me/campaigns/${campaignId}/placements`, {
        method: 'POST',
        body: { platformCode },
      }),
    onSuccess: (placement) =>
      queryClient.setQueryData<Campaign[]>(keys.campaigns, (list) => replacePlacement(list, placement)),
  })
}

export function useSubmitPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ trackingToken, postUrl }: { trackingToken: string; postUrl: string }) =>
      apiFetch<Placement>(`api/affiliate/me/placements/${encodeURIComponent(trackingToken)}/post`, {
        method: 'PUT',
        body: { postUrl },
      }),
    onSuccess: (placement) => {
      if (placement.socialPostId != null)
        queryClient.setQueryData<SocialPost[]>(keys.socialPosts, (list) => replaceSocialPlacement(list, placement))
      else queryClient.setQueryData<Campaign[]>(keys.campaigns, (list) => replacePlacement(list, placement))
      void queryClient.invalidateQueries({ queryKey: keys.me })
    },
  })
}

export function useSocialPosts() {
  return useQuery({
    queryKey: keys.socialPosts,
    queryFn: ({ signal }) => apiFetch<SocialPost[]>('api/affiliate/me/social-posts', { signal }),
  })
}

function replaceSocialPlacement(list: SocialPost[] | undefined, placement: Placement): SocialPost[] | undefined {
  return list?.map((post) =>
    post.id !== placement.socialPostId
      ? post
      : { ...post, placements: post.placements.map((p) => (p.trackingToken === placement.trackingToken ? placement : p)) },
  )
}

/** Gets (or makes) my tracked link for sharing a Solasta post on a platform. */
export function useShareSocialPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, platformCode }: { postId: number; platformCode: string }) =>
      apiFetch<SocialPost>(`api/affiliate/me/social-posts/${postId}/share`, { method: 'POST', body: { platformCode } }),
    onSuccess: (post) =>
      queryClient.setQueryData<SocialPost[]>(keys.socialPosts, (list) => list?.map((p) => (p.id === post.id ? post : p))),
  })
}

/** Path of a post's picture or video, streamed through the API (fetch it with apiFetchBlob). */
export function socialMediaPath(postId: number, index: number) {
  return `api/affiliate/me/social-posts/${postId}/media/${index}`
}
