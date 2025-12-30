import { useState } from "react"
import { AppSidebar } from "@/components/sidebar/left-sidebar"
import { MainContent } from "@/components/main-content"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getAreaById, getProjectById } from "@/data/app-data"
import type { Selection } from "@/types/selection"

function getHeaderTitle(selection: Selection | null): string {
  if (!selection) return "Dashboard"

  switch (selection.type) {
    case "nav":
      switch (selection.id) {
        case "today": return "Today"
        case "this-week": return "This Week"
        case "inbox": return "Inbox"
        case "calendar": return "Calendar"
      }
      break
    case "area":
      return getAreaById(selection.id)?.title ?? "Area"
    case "project":
      return getProjectById(selection.id)?.title ?? "Project"
  }
  return "Dashboard"
}

export function App() {
  const [selection, setSelection] = useState<Selection | null>(null)

  return (
    <SidebarProvider>
      <AppSidebar selection={selection} onSelectionChange={setSelection} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-medium">{getHeaderTitle(selection)}</h1>
        </header>
        <main className="flex-1 p-6">
          <MainContent selection={selection} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
