import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DetailSideBarProps {
  isOpen: boolean
  children: ReactNode
  width?: number
}

export function DetailSideBar({
  isOpen,
  children,
  width = 400,
}: DetailSideBarProps) {
  // Use min() to prevent overflow on mobile - cap at 90vw
  const responsiveWidth = `min(${width}px, 90vw)`

  return (
    <aside
      className={cn(
        'bg-sidebar border-l flex-shrink-0 overflow-hidden',
        'transition-[width,opacity] duration-150 ease-out',
        isOpen ? 'opacity-100' : 'w-0 opacity-0'
      )}
      style={{ width: isOpen ? responsiveWidth : 0 }}
    >
      <div className="h-full" style={{ width: responsiveWidth }}>
        {children}
      </div>
    </aside>
  )
}
