import { describe, expect, it } from 'vitest'
import { en, es } from './messages'
import { translate } from './index'
import { isPostUrl, shareUrl } from '@/features/portal/share'

describe('i18n', () => {
  it('has a Spanish text for every English key', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort())
    for (const value of Object.values(es)) expect(value.trim()).not.toBe('')
  })

  it('keeps the same placeholders in both languages', () => {
    const names = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
    for (const key of Object.keys(en) as (keyof typeof en)[]) expect(names(es[key])).toEqual(names(en[key]))
  })

  it('fills placeholders', () => {
    expect(translate('dashboard.greeting', { name: 'Ana' }, 'es')).toBe('Hola Ana')
  })
})

describe('share helpers', () => {
  it('accepts only full web links as post links', () => {
    expect(isPostUrl('https://www.instagram.com/p/abc/')).toBe(true)
    expect(isPostUrl('instagram.com/p/abc')).toBe(false)
    expect(isPostUrl('javascript:alert(1)')).toBe(false)
  })

  it('builds share links only where the platform supports them', () => {
    expect(shareUrl('X', 'https://a.b/?ref=X', 'hi')).toBe('https://x.com/intent/post?text=hi&url=https%3A%2F%2Fa.b%2F%3Fref%3DX')
    expect(shareUrl('IG', 'https://a.b', 'hi')).toBeNull()
  })
})
