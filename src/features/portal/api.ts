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
  createdDate: string
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
      queryClient.setQueryData<Campaign[]>(keys.campaigns, (list) => replacePlacement(list, placement))
      void queryClient.invalidateQueries({ queryKey: keys.me })
    },
  })
}
