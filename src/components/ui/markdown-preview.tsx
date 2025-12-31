import Markdown from "react-markdown"
import { cn } from "@/lib/utils"

interface MarkdownPreviewProps {
  content: string
  className?: string
}

/**
 * Read-only markdown renderer using react-markdown.
 * Styled to match the Milkdown editor appearance.
 */
export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div className={cn("markdown-preview text-sm", className)}>
      <Markdown>{content}</Markdown>
    </div>
  )
}
