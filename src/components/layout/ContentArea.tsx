import type { ReactNode } from 'react'

interface ContentAreaProps {
  children: ReactNode
}

export function ContentArea({ children }: ContentAreaProps) {
  return <main className="flex-1 overflow-y-auto p-6">{children}</main>
}
