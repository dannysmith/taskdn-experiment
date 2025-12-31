import { cn } from '@/lib/utils'
import { LazyMilkdownPreview } from '@/components/tasks/lazy-milkdown-editor'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

/**
 * Read-only markdown renderer using Milkdown in read-only mode.
 * Shares the same lazy-loaded chunk as the editor.
 */
export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <LazyMilkdownPreview
      content={content}
      className={cn('markdown-preview text-sm', className)}
    />
  )
}
