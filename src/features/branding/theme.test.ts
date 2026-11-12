import { describe, expect, it } from 'vitest'
import { applyAccentColor, foregroundFor, luminance } from './theme'

describe('branding theme', () => {
  it('reads hex colors and rejects anything else', () => {
    expect(luminance('#FFFFFF')).toBeCloseTo(1)
    expect(luminance('#000000')).toBe(0)
    expect(luminance('red')).toBeNull()
  })

  it('picks readable text for light and dark accents', () => {
    expect(foregroundFor('#D7AE68')).toContain('0.18') // gold accent: dark text
    expect(foregroundFor('#1D4ED8')).toContain('0.98') // dark blue accent: light text
  })

  it('applies a tenant color and restores the default theme', () => {
    const root = document.createElement('div')
    applyAccentColor('#1D4ED8', root)
    expect(root.style.getPropertyValue('--primary')).toBe('#1D4ED8')

    applyAccentColor(null, root)
    expect(root.style.getPropertyValue('--primary')).toBe('')
  })
})
