import * as React from "react"
import { Crepe } from "@milkdown/crepe"
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react"

import "@milkdown/crepe/theme/common/style.css"
import "@milkdown/crepe/theme/frame.css"

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface MilkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// -----------------------------------------------------------------------------
// Internal Editor Component
// -----------------------------------------------------------------------------

interface CrepeEditorProps {
  defaultValue: string
  onChange: (value: string) => void
  placeholder?: string
}

function CrepeEditor({ defaultValue, onChange, placeholder }: CrepeEditorProps) {
  const crepeRef = React.useRef<Crepe | null>(null)

  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue,
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: placeholder ?? "Add notes...",
        },
      },
    })

    // Listen for content changes
    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        onChange(markdown)
      })
    })

    crepeRef.current = crepe
    return crepe.editor
  }, [])

  return <Milkdown />
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function MilkdownEditor({ value, onChange, placeholder }: MilkdownEditorProps) {
  // Use a key to force remount when the task changes
  // This ensures the editor resets to the new task's content
  const [editorKey, setEditorKey] = React.useState(0)
  const initialValueRef = React.useRef(value)

  // When value changes externally (different task selected), remount the editor
  React.useEffect(() => {
    if (value !== initialValueRef.current) {
      initialValueRef.current = value
      setEditorKey((k) => k + 1)
    }
  }, [value])

  return (
    <div className="milkdown-wrapper rounded-lg border bg-background min-h-[200px]">
      <MilkdownProvider key={editorKey}>
        <CrepeEditor
          defaultValue={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      </MilkdownProvider>
    </div>
  )
}
