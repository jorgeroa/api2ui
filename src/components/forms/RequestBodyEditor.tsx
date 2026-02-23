import { useState } from 'react'

interface RequestBodyEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export function RequestBodyEditor({
  value,
  onChange,
  placeholder = '{\n  "key": "value"\n}',
  rows = 6,
}: RequestBodyEditorProps) {
  const [jsonError, setJsonError] = useState<string | null>(null)

  const validate = (text: string) => {
    if (!text.trim()) {
      setJsonError(null)
      return
    }
    try {
      JSON.parse(text)
      setJsonError(null)
    } catch (e) {
      setJsonError((e as Error).message)
    }
  }

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => validate(value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-input rounded-md font-mono text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus-visible:ring-ring/50 resize-y"
      />
      {jsonError && (
        <p className="text-red-500 text-xs mt-1">Invalid JSON: {jsonError}</p>
      )}
    </div>
  )
}
