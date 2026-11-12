/**
 * Share helpers. Facebook, X, LinkedIn and WhatsApp accept a link in a share URL; Instagram and TikTok
 * do not, so for those the affiliate copies the link (or uses the phone's share sheet) and posts it themselves.
 */
export function shareUrl(platformCode: string, url: string, text: string): string | null {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(text)
  switch (platformCode.toUpperCase()) {
    case 'FB':
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`
    case 'X':
      return `https://x.com/intent/post?text=${t}&url=${u}`
    case 'LI':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`
    case 'EM':
      return `mailto:?body=${encodeURIComponent(`${text} ${url}`)}`
    default:
      return null
  }
}

/** True when the browser has a native share sheet (most phones). */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

/** Opens the native share sheet; resolves false when unavailable or the person cancels. */
export async function nativeShare(url: string, text: string, title: string): Promise<boolean> {
  if (!canNativeShare()) return false
  try {
    await navigator.share({ url, text, title })
    return true
  } catch {
    return false
  }
}

/** Copies text; falls back to a hidden textarea where the async clipboard API is unavailable. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      area.remove()
      return ok
    } catch {
      return false
    }
  }
}

/** A post link must be a full http(s) URL; the API checks the same. */
export function isPostUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
