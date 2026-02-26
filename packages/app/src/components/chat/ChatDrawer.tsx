import { useEffect } from 'react'
import { useChatStore } from '../../store/chatStore'
import { ChatPanel } from './ChatPanel'

export function ChatDrawer() {
  const { open, setOpen } = useChatStore()

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-200 z-40 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-background rounded-t-xl shadow-lg transition-transform duration-200 ease-out z-50 flex flex-col ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '70vh' }}
      >
        {/* Drag handle */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex justify-center py-2 cursor-pointer shrink-0"
          aria-label={open ? 'Close chat' : 'Open chat'}
        >
          <div className="w-12 h-1.5 bg-muted rounded-full" />
        </button>

        {/* Chat content fills remaining space */}
        <div className="flex-1 min-h-0">
          <ChatPanel />
        </div>
      </div>
    </>
  )
}
