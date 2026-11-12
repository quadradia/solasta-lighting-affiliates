const DARK_TEXT = 'oklch(0.18 0.02 240)'
const LIGHT_TEXT = 'oklch(0.98 0.005 85)'

/** Relative luminance (WCAG) of a #RRGGBB color, or null when it is not one. */
export function luminance(hex: string): number | null {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!match) return null
  const [r, g, b] = match.slice(1).map((h) => {
    const c = parseInt(h, 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Text color that stays readable on top of the accent color. */
export function foregroundFor(hex: string): string {
  const l = luminance(hex)
  return l !== null && l < 0.35 ? LIGHT_TEXT : DARK_TEXT
}

const VARS = ['--primary', '--accent', '--ring', '--primary-foreground', '--accent-foreground'] as const

/** Applies a tenant accent color over the default theme, or restores the default when null. */
export function applyAccentColor(hex: string | null | undefined, root: HTMLElement = document.documentElement) {
  if (!hex || luminance(hex) === null) {
    VARS.forEach((v) => root.style.removeProperty(v))
    return
  }
  const fg = foregroundFor(hex)
  root.style.setProperty('--primary', hex)
  root.style.setProperty('--accent', hex)
  root.style.setProperty('--ring', hex)
  root.style.setProperty('--primary-foreground', fg)
  root.style.setProperty('--accent-foreground', fg)
}
