import type { ReactNode } from 'react'

/** Label/value pairs; empty values show a dash. */
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-1">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
          <dd className="text-sm">{value === null || value === undefined || value === '' ? '—' : value}</dd>
        </div>
      ))}
    </dl>
  )
}
