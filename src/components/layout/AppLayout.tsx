import { NavLink, Outlet } from 'react-router'
import { useAuth } from 'react-oidc-context'
import type { Icon } from '@phosphor-icons/react'
import { House, ShareNetwork, Coins, UserCircle, SignOut } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { BrandMark, useTenantTheme } from '@/features/branding/BrandMark'
import { LANGUAGES, useI18n, type MessageKey } from '@/i18n'
import { displayName } from '@/lib/auth'
import { cn } from '@/lib/utils'

const nav: { label: MessageKey; to: string; icon: Icon; end?: boolean }[] = [
  { label: 'nav.dashboard', to: '/', icon: House, end: true },
  { label: 'nav.links', to: '/share', icon: ShareNetwork },
  { label: 'nav.earnings', to: '/earnings', icon: Coins },
  { label: 'nav.profile', to: '/profile', icon: UserCircle },
]

export function LanguageSwitch({ className }: { className?: string }) {
  const { language, setLanguage, t } = useI18n()
  return (
    <div role="group" aria-label={t('common.language')} className={cn('flex rounded-md border p-0.5 text-xs', className)}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={language === code}
          title={label}
          onClick={() => setLanguage(code)}
          className={cn(
            'rounded px-2 py-1 font-medium uppercase transition-colors',
            language === code ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {code}
        </button>
      ))}
    </div>
  )
}

/**
 * Phone first: a top bar and a bottom tab bar on small screens, a sidebar from md up.
 * Most affiliates open the portal on their phone right before or after posting.
 */
export function AppLayout() {
  const auth = useAuth()
  const { t } = useI18n()
  const name = displayName(auth.user)
  useTenantTheme()

  const links = (variant: 'side' | 'bottom') =>
    nav.map(({ label, to, icon: ItemIcon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) =>
          variant === 'side'
            ? cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            : cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
        }
      >
        <ItemIcon className={variant === 'side' ? 'size-4' : 'size-6'} />
        {t(label)}
      </NavLink>
    ))

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="hidden shrink-0 flex-col border-r bg-card md:flex md:w-60">
        <div className="px-5 py-4">
          <BrandMark />
        </div>
        <nav aria-label={t('nav.main')} className="flex flex-1 flex-col gap-1 px-3">
          {links('side')}
        </nav>
        <div className="flex flex-col gap-3 border-t px-5 py-3">
          <LanguageSwitch className="self-start" />
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm text-muted-foreground" title={name}>
              {name}
            </span>
            <Button variant="ghost" size="icon" aria-label={t('common.signOut')} onClick={() => void auth.signoutRedirect()}>
              <SignOut />
            </Button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-card/95 px-4 py-2 backdrop-blur md:hidden">
        <BrandMark />
        <div className="flex items-center gap-1">
          <LanguageSwitch />
          <Button variant="ghost" size="icon" aria-label={t('common.signOut')} onClick={() => void auth.signoutRedirect()}>
            <SignOut />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden px-4 pt-5 pb-24 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>

      <nav
        aria-label={t('nav.main')}
        className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {links('bottom')}
      </nav>
    </div>
  )
}
