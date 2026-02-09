import { useState } from 'react'
import { toast } from 'sonner'

interface TagChipsProps {
  tags: string[]
  maxVisible?: number
}

export function TagChips({ tags, maxVisible = 5 }: TagChipsProps) {
  const [expanded, setExpanded] = useState(false)

  // Compute visible tags
  const visibleTags = expanded ? tags : tags.slice(0, maxVisible)
  const hiddenCount = tags.length - maxVisible

  // Handle copy to clipboard
  const handleCopy = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag)
      toast.success('Copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="inline-flex items-center gap-1 flex-wrap">
      {visibleTags.map((tag, index) => (
        <button
          key={`${tag}-${index}`}
          onClick={() => handleCopy(tag)}
          title="Click to copy"
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
        >
          {tag}
        </button>
      ))}

      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-muted-foreground hover:underline"
        >
          +{hiddenCount} more
        </button>
      )}
    </div>
  )
}
