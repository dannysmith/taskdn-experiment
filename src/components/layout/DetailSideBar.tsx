import type { ReactNode } from 'react'

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
  return (
    <aside
      className={`
        bg-sidebar border-l flex-shrink-0 overflow-hidden
        transition-[width,opacity] duration-150 ease-out
        ${isOpen ? `w-[${width}px] opacity-100` : 'w-0 opacity-0'}
      `}
      style={{ width: isOpen ? width : 0 }}
    >
      <div className="h-full" style={{ width }}>
        {children}
      </div>
    </aside>
  )
}
