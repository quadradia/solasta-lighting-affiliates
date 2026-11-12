import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch, apiFetchBlob } from '@/lib/api'

/** TenantBrandingDto on the API (read-only here; staff edit it in the admin app). */
export interface TenantBranding {
  tenantName: string
  appName?: string | null
  primaryColor?: string | null
  hasLogo: boolean
  logoVersion?: string | null
}

/** Bundled fallback logo (public/logo.svg), used until the tenant's logo loads. */
export const DEFAULT_LOGO_URL = '/logo.svg'

const base = 'api/tenant/branding'
const brandingKey = ['tenant-branding'] as const

export function useBranding() {
  return useQuery({
    queryKey: brandingKey,
    queryFn: ({ signal }) => apiFetch<TenantBranding>(base, { signal }),
    staleTime: 5 * 60_000,
    // Branding is cosmetic: never block the portal on it.
    retry: 1,
  })
}

/** Object URL of the tenant's logo (the endpoint needs the bearer token), or the default logo. */
export function useLogoUrl(branding: TenantBranding | undefined): string {
  const version = branding?.hasLogo ? branding.logoVersion ?? 'current' : null
  const logo = useQuery({
    queryKey: [...brandingKey, 'logo', version],
    queryFn: ({ signal }) => apiFetchBlob(`${base}/logo`, signal),
    enabled: version !== null,
    staleTime: Infinity,
    retry: 1,
  })
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!logo.data) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(logo.data)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [logo.data])
  return version !== null && url ? url : DEFAULT_LOGO_URL
}
