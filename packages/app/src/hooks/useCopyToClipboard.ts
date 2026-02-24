import { useState, useCallback } from 'react'

interface UseCopyToClipboardResult {
  copy: (text: string) => Promise<void>
  isCopied: boolean
}

export function useCopyToClipboard(): UseCopyToClipboardResult {
  const [isCopied, setIsCopied] = useState(false)

  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.error('Clipboard API not available')
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }, [])

  return { copy, isCopied }
}
