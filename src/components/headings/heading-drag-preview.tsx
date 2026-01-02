import { cn } from '@/lib/utils'
import type { Heading } from '@/types/headings'
import { headingColorConfig } from '@/config/heading-colors'

interface HeadingDragPreviewProps {
  heading: Heading
}

export function HeadingDragPreview({ heading }: HeadingDragPreviewProps) {
  const colorConfig = headingColorConfig[heading.color]

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-lg bg-card shadow-xl border border-border/50',
        'border-b-2',
        colorConfig.borderClass
      )}
    >
      <div
        className={cn('size-4 rounded-full shrink-0', colorConfig.dotClass)}
      />
      <span
        className={cn('text-sm font-medium truncate', colorConfig.textClass)}
      >
        {heading.title || (
          <span className="text-muted-foreground italic">Untitled</span>
        )}
      </span>
    </div>
  )
}
