/** Types for LLM chat integration (OpenAI-compatible format used by OpenRouter) */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface Tool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, ToolParameter>
      required?: string[]
    }
  }
}

export interface ToolParameter {
  type: string
  description?: string
  enum?: string[]
  default?: unknown
}

export interface LLMResponse {
  id: string
  choices: Array<{
    message: ChatMessage
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/** A message in the chat UI (extends LLM message with UI-specific fields) */
export interface UIMessage {
  id: string
  role: 'user' | 'assistant' | 'tool-result'
  text: string | null
  /** API response data to render with DynamicRenderer */
  apiData?: unknown
  /** Which tool was called */
  toolName?: string
  /** Tool call arguments */
  toolArgs?: Record<string, unknown>
  /** Is this message still streaming/loading */
  loading?: boolean
  /** Error message if something went wrong */
  error?: string
  timestamp: number
}

export interface ChatConfig {
  apiKey: string
  model: string
  provider: 'openrouter' | 'openai' | 'anthropic'
}
