import { useState } from 'react'
import { useChatStore } from '../../store/chatStore'

const PROVIDER_MODELS: Record<string, Array<{ value: string; label: string }>> = {
  openrouter: [
    { value: 'anthropic/claude-haiku', label: 'Claude Haiku (fastest, cheapest)' },
    { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4.1', label: 'GPT-4.1' },
  ],
  anthropic: [
    { value: 'anthropic/claude-haiku', label: 'Claude Haiku' },
    { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
  ],
}

export function ChatSettings() {
  const { config, setConfig } = useChatStore()
  const [showKey, setShowKey] = useState(false)

  const models = PROVIDER_MODELS[config.provider] ?? []

  return (
    <div className="p-3 border-b border-border space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Provider</label>
          <select
            value={config.provider}
            onChange={(e) => {
              const provider = e.target.value as typeof config.provider
              const defaultModel = PROVIDER_MODELS[provider]?.[0]?.value ?? ''
              setConfig({ provider, model: defaultModel })
            }}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="openrouter">OpenRouter</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Model</label>
          <select
            value={config.model}
            onChange={(e) => setConfig({ model: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            {models.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">API Key</label>
        <div className="flex gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={config.apiKey}
            onChange={(e) => setConfig({ apiKey: e.target.value })}
            placeholder={config.provider === 'openrouter' ? 'sk-or-...' : 'sk-...'}
            className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={() => setShowKey((s) => !s)}
            className="px-2 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        {config.provider === 'openrouter' && (
          <p className="text-xs text-muted-foreground mt-1">
            Get a free key at{' '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              openrouter.ai/keys
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
