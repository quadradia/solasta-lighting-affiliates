import { useState } from 'react'
import { ErrorPanel } from '@/components/ErrorPanel'
import { PageHeader } from '@/components/PageHeader'
import { NotAnAffiliate } from '@/components/RequireAffiliate'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useI18n, type MessageKey } from '@/i18n'
import { ApiError } from '@/lib/api'
import { formatDate, formatNumber, formatSigned } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useBucks, type BucksEntry } from './api'

const PAGE_SIZE = 20

function useTypeName() {
  const { t } = useI18n()
  return (entry: BucksEntry) => {
    const key = `earnings.type.${entry.typeCode}` as MessageKey
    const text = t(key)
    return text === key ? entry.typeName : text
  }
}

export function EarningsPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const bucks = useBucks(page, PAGE_SIZE)
  const typeName = useTypeName()

  if (bucks.error instanceof ApiError && bucks.error.status === 403) return <NotAnAffiliate />

  const data = bucks.data
  const pages = data ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE)) : 1

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('earnings.title')}
        description={t('earnings.subtitle')}
        actions={
          data ? (
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">{t('earnings.balance')}</span>
              <span className="text-2xl font-semibold text-primary">{t('common.bucks', { count: formatNumber(data.balance) })}</span>
            </div>
          ) : null
        }
      />
      {bucks.error ? (
        <ErrorPanel error={bucks.error} onRetry={() => void bucks.refetch()} />
      ) : !data ? (
        <Skeleton className="h-64" />
      ) : data.totalCount === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('earnings.empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Phones: a list. Wider screens: a table. */}
          <ul className="flex flex-col divide-y rounded-xl border bg-card md:hidden">
            {data.items.map((e) => (
              <li key={e.proxy} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{typeName(e)}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {formatDate(e.transactionDate)}
                    {e.description ? ` · ${e.description}` : ''}
                  </span>
                </div>
                <span className={cn('shrink-0 font-semibold tabular-nums', e.amount > 0 ? 'text-emerald-300' : e.amount < 0 ? 'text-red-300' : '')}>
                  {formatSigned(e.amount)}
                </span>
              </li>
            ))}
          </ul>
          <div className="hidden rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('earnings.date')}</TableHead>
                  <TableHead>{t('earnings.type')}</TableHead>
                  <TableHead>{t('earnings.description')}</TableHead>
                  <TableHead className="text-right">{t('earnings.amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((e) => (
                  <TableRow key={e.proxy}>
                    <TableCell>{formatDate(e.transactionDate)}</TableCell>
                    <TableCell>{typeName(e)}</TableCell>
                    <TableCell className="text-muted-foreground">{e.description ?? '—'}</TableCell>
                    <TableCell
                      className={cn('text-right font-semibold tabular-nums', e.amount > 0 ? 'text-emerald-300' : e.amount < 0 ? 'text-red-300' : '')}
                    >
                      {formatSigned(e.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {pages > 1 ? (
            <div className="flex items-center justify-between gap-2 text-sm">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('common.previous')}
              </Button>
              <span className="text-muted-foreground">{t('earnings.pageOf', { page, pages })}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                {t('common.next')}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
