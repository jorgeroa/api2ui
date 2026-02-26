/**
 * Hook that manages the chat conversation loop:
 * 1. User sends message
 * 2. Call LLM with tool definitions
 * 3. If LLM returns tool_call → execute API call → send result back → get final text
 * 4. Display text + rendered API data
 */

import { useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { useChatStore } from '../store/chatStore'
import { chatCompletion } from '../services/llm/client'
import { buildToolsFromUrl, buildToolsFromSpec, buildSystemPrompt } from '../services/llm/toolBuilder'
import { fetchWithAuth } from '../services/api/fetcher'
import type { ChatMessage, UIMessage, Tool } from '../services/llm/types'

let messageCounter = 0
function nextId(): string {
  return `msg-${Date.now()}-${++messageCounter}`
}

/**
 * Execute a tool call by making the actual API request.
 * For raw URLs: builds URL from base + path + query params.
 * For OpenAPI: delegates to fetchWithAuth with constructed URL.
 */
async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  apiUrl: string,
): Promise<unknown> {
  const parsedUrl = new URL(apiUrl)
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname.replace(/\/$/, '')}`

  if (toolName === 'query_api') {
    // Raw URL mode: build URL from base + path + query params
    let targetUrl = baseUrl
    if (args.path && typeof args.path === 'string') {
      let pathSegment = args.path.startsWith('/') ? args.path : `/${args.path}`
      // Guard against LLM repeating the base pathname (e.g. /products/products)
      const basePath = parsedUrl.pathname.replace(/\/$/, '')
      if (basePath !== '/' && pathSegment.startsWith(basePath)) {
        pathSegment = pathSegment.slice(basePath.length) || ''
      }
      if (pathSegment) targetUrl += pathSegment
    }

    const queryParams = new URLSearchParams()
    for (const [key, value] of Object.entries(args)) {
      if (key !== 'path' && value !== undefined && value !== '') {
        queryParams.set(key, String(value))
      }
    }
    const qs = queryParams.toString()
    if (qs) targetUrl += `?${qs}`

    return fetchWithAuth(targetUrl)
  }

  // OpenAPI mode: build URL from operation spec
  // Find the matching operation from parsedSpec
  const parsedSpec = useAppStore.getState().parsedSpec
  if (parsedSpec) {
    const operation = parsedSpec.operations.find(op => {
      const sanitized = (op.operationId || `${op.method}_${op.path}`)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
      return sanitized === toolName
    })

    if (operation) {
      let path = operation.path
      for (const param of operation.parameters) {
        if (param.in === 'path' && args[param.name] !== undefined) {
          path = path.replace(`{${param.name}}`, encodeURIComponent(String(args[param.name])))
        }
      }

      let opUrl = `${parsedSpec.baseUrl}${path}`
      const queryParams = new URLSearchParams()
      for (const param of operation.parameters) {
        if (param.in === 'query' && args[param.name] !== undefined) {
          queryParams.set(param.name, String(args[param.name]))
        }
      }
      const qs = queryParams.toString()
      if (qs) opUrl += `?${qs}`

      const options = operation.method !== 'get' && args.body
        ? { method: operation.method.toUpperCase(), body: String(args.body) }
        : undefined
      return fetchWithAuth(opUrl, options)
    }
  }

  // Fallback: just call the base URL
  return fetchWithAuth(apiUrl)
}

export function useChat() {
  const url = useAppStore((s) => s.url)
  const parsedSpec = useAppStore((s) => s.parsedSpec)
  const { messages, addMessage, updateMessage, clearMessages, config, sending, setSending } = useChatStore()

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !url || sending) return
    if (!config.apiKey) {
      addMessage({
        id: nextId(),
        role: 'assistant',
        text: 'Please set your API key in chat settings first.',
        timestamp: Date.now(),
        error: 'No API key configured',
      })
      return
    }

    // Add user message
    const userMsg: UIMessage = {
      id: nextId(),
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    }
    addMessage(userMsg)

    // Add placeholder assistant message
    const assistantId = nextId()
    addMessage({
      id: assistantId,
      role: 'assistant',
      text: null,
      loading: true,
      timestamp: Date.now(),
    })

    setSending(true)

    try {
      // Build tools and system prompt
      const tools: Tool[] = parsedSpec
        ? buildToolsFromSpec(parsedSpec)
        : buildToolsFromUrl(url)

      const systemPrompt = buildSystemPrompt(url, parsedSpec)

      // Build conversation history for LLM
      const llmMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
      ]

      // Add previous messages (skip tool-result UI messages, they're in the LLM history as tool messages)
      for (const m of messages) {
        if (m.role === 'user') {
          llmMessages.push({ role: 'user', content: m.text || '' })
        } else if (m.role === 'assistant' && m.text) {
          llmMessages.push({ role: 'assistant', content: m.text })
        }
      }

      // Add the new user message
      llmMessages.push({ role: 'user', content: text.trim() })

      // Call LLM
      const response = await chatCompletion(llmMessages, tools, config)
      const choice = response.choices[0]
      if (!choice) throw new Error('No response from LLM')

      const assistantMessage = choice.message

      // Check if LLM wants to call a tool
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolCall = assistantMessage.tool_calls[0]!
        const toolArgs = JSON.parse(toolCall.function.arguments)

        // Update assistant message to show tool call
        updateMessage(assistantId, {
          text: `Calling ${toolCall.function.name}...`,
          toolName: toolCall.function.name,
          toolArgs,
        })

        // Execute the tool
        let toolResult: unknown
        try {
          toolResult = await executeToolCall(toolCall.function.name, toolArgs, url)
        } catch (err) {
          updateMessage(assistantId, {
            text: `API call failed: ${err instanceof Error ? err.message : String(err)}`,
            loading: false,
            error: String(err),
          })
          setSending(false)
          return
        }

        // Add tool result as a UI message for rendering
        const toolResultMsg: UIMessage = {
          id: nextId(),
          role: 'tool-result',
          text: null,
          apiData: toolResult,
          toolName: toolCall.function.name,
          toolArgs,
          timestamp: Date.now(),
        }
        addMessage(toolResultMsg)

        // Send tool result back to LLM for summarization
        const truncatedResult = JSON.stringify(toolResult).slice(0, 8000)
        const followUpMessages: ChatMessage[] = [
          ...llmMessages,
          {
            role: 'assistant',
            content: null,
            tool_calls: assistantMessage.tool_calls,
          },
          {
            role: 'tool',
            content: truncatedResult,
            tool_call_id: toolCall.id,
          },
        ]

        const followUp = await chatCompletion(followUpMessages, tools, config)
        const followUpChoice = followUp.choices[0]

        updateMessage(assistantId, {
          text: followUpChoice?.message?.content || 'Done.',
          loading: false,
        })
      } else {
        // No tool call — just a text response
        updateMessage(assistantId, {
          text: assistantMessage.content || '',
          loading: false,
        })
      }
    } catch (err) {
      updateMessage(assistantId, {
        text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        loading: false,
        error: String(err),
      })
    } finally {
      setSending(false)
    }
  }, [url, parsedSpec, messages, config, sending, addMessage, updateMessage, setSending])

  return {
    messages,
    sendMessage,
    clearMessages,
    sending,
    hasApiKey: !!config.apiKey,
  }
}
