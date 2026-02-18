/**
 * Share button that generates a shareable URL and copies it to clipboard.
 * Shows a warning toast if the API requires authentication.
 */

import { toast } from 'sonner'
import { collectShareableState } from '../services/sharing/hydrator'
import { buildShareableUrl } from '../services/sharing/encoder'
import { useAuthStore } from '../store/authStore'
import { useAppStore } from '../store/appStore'

export function ShareButton() {
  const url = useAppStore((s) => s.url)

  const handleShare = async () => {
    const state = collectShareableState()
    if (!state) {
      toast.error('Nothing to share', { description: 'Fetch an API first.' })
      return
    }

    const shareUrl = buildShareableUrl(state)

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard')
    } catch {
      // Fallback for older browsers or non-HTTPS contexts
      toast.info('Share link', { description: shareUrl, duration: 10000 })
    }

    // Warn if the API requires authentication
    if (url) {
      const authStore = useAuthStore.getState()
      const cred = authStore.getActiveCredential(url)
      if (cred) {
        toast.warning('This API requires authentication', {
          description: "Others won't be able to access it without credentials.",
          duration: 5000,
        })
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-muted-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus-visible:ring-ring/50 focus:ring-offset-1"
      title="Copy shareable link"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
      Share
    </button>
  )
}
