import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts'
import { config } from './config'

/** Role the Identity Server grants affiliates when the Solasta API invites them on approval. */
export const AFFILIATE_ROLE = 'affiliate'

/**
 * Authorization Code + PKCE against the NOAH Identity Server. The client is public, so there is
 * no secret. Tokens live in sessionStorage (cleared when the tab closes), never localStorage.
 */
export const userManager = new UserManager({
  authority: config.oidcAuthority,
  client_id: config.oidcClientId,
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  response_type: 'code',
  // "affiliate" is the API scope the Solasta API's Affiliate policy requires (with the affiliate role).
  scope: 'openid profile email affiliate offline_access',
  // Refresh tokens are one-time-use on the server, so renewals rotate them.
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  extraQueryParams: config.oidcTenant ? { acr_values: `tenant:${config.oidcTenant}` } : undefined,
})

/** Returns the claims of a JWT without verifying it (the API verifies; this only drives the UI). */
export function decodeJwtPayload(token: string | undefined): Record<string, unknown> {
  const part = token?.split('.')[1]
  if (!part) return {}
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = decodeURIComponent(
      Array.from(atob(padded), (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return {}
  }
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  return typeof value === 'string' ? [value] : []
}

/** Roles from the access token (what the API checks), falling back to the ID token profile. */
export function getRoles(user: User | null | undefined): string[] {
  if (!user) return []
  const fromAccessToken = asList(decodeJwtPayload(user.access_token).role)
  return fromAccessToken.length > 0 ? fromAccessToken : asList(user.profile.role)
}

export function isAffiliate(user: User | null | undefined) {
  return getRoles(user).includes(AFFILIATE_ROLE)
}

/** Display name for the signed-in user. */
export function displayName(user: User | null | undefined) {
  const p = user?.profile
  if (!p) return ''
  return p.name || [p.given_name, p.family_name].filter(Boolean).join(' ') || p.email || p.preferred_username || ''
}
