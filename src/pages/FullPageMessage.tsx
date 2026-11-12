import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface FullPageMessageProps {
  title: string
  message?: ReactNode
  action?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
}

export function FullPageMessage({ title, message, action, secondaryAction }: FullPageMessageProps) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        {/* Shown before sign-in, when the tenant's branding is not known yet. */}
        <img src="/logo.svg" alt="" className="size-14" />
        <h1 className="text-xl font-semibold">{title}</h1>
        {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}
        {action || secondaryAction ? (
          <div className="flex gap-2">
            {secondaryAction ? (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            ) : null}
            {action ? <Button onClick={action.onClick}>{action.label}</Button> : null}
          </div>
        ) : null}
      </div>
    </main>
  )
}
