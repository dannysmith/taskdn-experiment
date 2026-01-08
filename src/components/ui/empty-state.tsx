import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description?: string
  className?: string
}

/**
 * A consistent empty state display for lists and views.
 */
export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('py-12 text-center', className)}>
      <p className="text-muted-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground/70 mt-1">{description}</p>
      )}
    </div>
  )
}
