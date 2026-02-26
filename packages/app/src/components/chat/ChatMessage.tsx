import type { UIMessage } from '../../services/llm/types'

interface ChatMessageProps {
  message: UIMessage
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="max-w-[85%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm">
          {message.text}
        </div>
      </div>
    )
  }

  if (message.role === 'tool-result') {
    return (
      <div className="px-4 py-1.5">
        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2.5 py-1.5 font-mono">
          {message.text}
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="flex justify-start px-4 py-2">
      <div className="max-w-[85%] rounded-lg bg-muted text-foreground px-3 py-2 text-sm">
        {message.loading ? (
          <span className="inline-flex items-center gap-1">
            <span className="animate-pulse">Thinking</span>
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </span>
        ) : message.error && !message.text?.startsWith('Error:') ? (
          <span className="text-destructive">{message.text || message.error}</span>
        ) : (
          <span className="whitespace-pre-wrap">{message.text}</span>
        )}
      </div>
    </div>
  )
}
