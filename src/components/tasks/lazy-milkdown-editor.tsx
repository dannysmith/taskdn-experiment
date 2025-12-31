import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const MilkdownEditor = lazy(() => import('./milkdown-editor'))

const MilkdownPreview = lazy(() =>
  import('./milkdown-editor').then((mod) => ({ default: mod.MilkdownPreview }))
)

interface LazyMilkdownEditorProps {
  editorKey: string
  defaultValue: string
  onChange: (value: string) => void
  className?: string
}

export function LazyMilkdownEditor(props: LazyMilkdownEditorProps) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <MilkdownEditor {...props} />
    </Suspense>
  )
}

interface LazyMilkdownPreviewProps {
  content: string
  className?: string
}

export function LazyMilkdownPreview(props: LazyMilkdownPreviewProps) {
  return (
    <Suspense fallback={<PreviewSkeleton />}>
      <MilkdownPreview {...props} />
    </Suspense>
  )
}

function EditorSkeleton() {
  return (
    <div className="space-y-2 p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

function PreviewSkeleton() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  )
}
