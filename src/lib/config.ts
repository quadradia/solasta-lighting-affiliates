/**
 * Build-time settings from VITE_* variables (see .env.example). Every value here ships in
 * the browser bundle, so none of them may be a secret.
 */
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env.local and fill it in.`)
  return value.replace(/\/+$/, '')
}

export const config = {
  oidcAuthority: required('VITE_OIDC_AUTHORITY', import.meta.env.VITE_OIDC_AUTHORITY),
  oidcClientId: import.meta.env.VITE_OIDC_CLIENT_ID || 'affiliate-portal',
  /** Solasta Lighting DealerTenant proxy; the login page only admits members of this tenant. */
  oidcTenant: import.meta.env.VITE_OIDC_TENANT as string | undefined,
  apiBaseUrl: required('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
  /** Where affiliates write for help. */
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'affiliates@mysolasta.com',
}
