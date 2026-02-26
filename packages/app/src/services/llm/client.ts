/**
 * LLM API client for chat. Calls OpenRouter (OpenAI-compatible) directly from browser.
 * OpenRouter supports CORS, so no backend proxy needed for the initial version.
 */

import type { ChatMessage, Tool, LLMResponse, ChatConfig } from './types'

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
const OPENAI_BASE = 'https://api.openai.com/v1'

function getBaseUrl(provider: ChatConfig['provider']): string {
  switch (provider) {
    case 'openrouter': return OPENROUTER_BASE
    case 'openai': return OPENAI_BASE
    case 'anthropic': return OPENROUTER_BASE // Anthropic models via OpenRouter
  }
}

/**
 * Send a chat completion request with tool definitions.
 * Returns the assistant's response (may include tool_calls).
 */
export async function chatCompletion(
  messages: ChatMessage[],
  tools: Tool[],
  config: ChatConfig,
): Promise<LLMResponse> {
  const baseUrl = getBaseUrl(config.provider)

  const body: Record<string, unknown> = {
    model: config.model,
    messages,
  }

  if (tools.length > 0) {
    body.tools = tools
    body.tool_choice = 'auto'
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter' ? {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'api2ui',
      } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage: string
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.error?.message || errorJson.message || errorText
    } catch {
      errorMessage = errorText
    }
    throw new Error(`LLM API error (${response.status}): ${errorMessage}`)
  }

  return response.json()
}

/** Default models for each provider */
export const DEFAULT_MODELS: Record<ChatConfig['provider'], string> = {
  openrouter: 'anthropic/claude-haiku',
  openai: 'gpt-4o-mini',
  anthropic: 'anthropic/claude-haiku',
}
