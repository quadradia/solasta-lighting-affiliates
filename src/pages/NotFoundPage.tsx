import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

export function NotFoundPage() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">{t('notFound.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('notFound.body')}</p>
      <Button asChild variant="outline">
        <Link to="/">{t('notFound.home')}</Link>
      </Button>
    </div>
  )
}
