import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

interface ExternalLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  title?: string
}

export function ExternalLink({ href, children, className, title }: ExternalLinkProps) {
  const [showDialog, setShowDialog] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDialog(true)
  }

  const handleContinue = () => {
    window.open(href, '_blank', 'noopener,noreferrer')
    setShowDialog(false)
  }

  // Extract hostname for display
  let hostname = ''
  try {
    hostname = new URL(href).hostname
  } catch {
    hostname = href
  }

  return (
    <>
      <a
        href={href}
        onClick={handleClick}
        className={className}
        title={title}
        role="link"
      >
        {children}
      </a>

      {showDialog && (
        <Dialog open={true} onClose={() => setShowDialog(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="max-w-md w-full bg-background rounded-xl shadow-2xl border border-border p-6">
              <DialogTitle className="text-lg font-semibold mb-2">
                Leaving api2ui
              </DialogTitle>

              <p className="text-sm text-muted-foreground mb-4">
                You are about to visit an external website. We have no control over its content.
              </p>

              <div className="bg-muted rounded-lg px-3 py-2 mb-5 min-w-0">
                <div className="text-xs text-muted-foreground mb-0.5">Destination</div>
                <div className="text-sm font-medium truncate" title={href}>{hostname}</div>
                <div className="text-xs text-muted-foreground truncate" title={href}>{href}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDialog(false)}
                  className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  Continue
                </button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </>
  )
}
