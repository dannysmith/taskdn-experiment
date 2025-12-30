import { cn } from "@/lib/utils"

export interface CardGridProps {
  children: React.ReactNode
  /** Minimum card width before wrapping to next column */
  minCardWidth?: number
  /** Gap between cards in pixels */
  gap?: number
  className?: string
}

/**
 * A responsive grid layout for cards.
 * Automatically adjusts the number of columns based on container width.
 */
export function CardGrid({
  children,
  minCardWidth = 280,
  gap = 16,
  className,
}: CardGridProps) {
  return (
    <div
      className={cn("grid", className)}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  )
}
