import { describe, expect, it } from 'vitest'
import type { User } from 'oidc-client-ts'
import { decodeJwtPayload, getRoles, isAffiliate } from './auth'

function jwt(payload: object) {
  // JWTs are base64url of UTF-8 bytes.
  const encode = (o: object) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  return `${encode({ alg: 'none' })}.${encode(payload)}.sig`
}

function user(accessClaims: object, profile: object = {}) {
  return { access_token: jwt(accessClaims), profile } as unknown as User
}

describe('roles', () => {
  it('reads a single role from the access token', () => {
    expect(isAffiliate(user({ role: 'affiliate' }))).toBe(true)
  })

  it('reads a role array from the access token', () => {
    expect(getRoles(user({ role: ['staff', 'affiliate'] }))).toEqual(['staff', 'affiliate'])
  })

  it('falls back to the ID token profile', () => {
    expect(isAffiliate(user({}, { role: 'affiliate' }))).toBe(true)
  })

  it('denies users without the affiliate role', () => {
    expect(isAffiliate(user({ role: 'staff' }))).toBe(false)
    expect(isAffiliate(null)).toBe(false)
  })

  it('decodes non-ASCII claims and tolerates garbage', () => {
    expect(decodeJwtPayload(jwt({ name: 'José' })).name).toBe('José')
    expect(decodeJwtPayload('not-a-jwt')).toEqual({})
  })
})
