import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UIMessage, ChatConfig } from '../services/llm/types'
import { DEFAULT_MODELS } from '../services/llm/client'

interface ChatState {
  /** Whether the chat panel is open */
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void

  /** Chat messages for current session */
  messages: UIMessage[]
  addMessage: (message: UIMessage) => void
  updateMessage: (id: string, updates: Partial<UIMessage>) => void
  clearMessages: () => void

  /** LLM configuration (persisted) */
  config: ChatConfig
  setConfig: (config: Partial<ChatConfig>) => void

  /** Whether a request is in flight */
  sending: boolean
  setSending: (sending: boolean) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      open: false,
      messages: [],
      config: {
        apiKey: '',
        model: DEFAULT_MODELS.openrouter,
        provider: 'openrouter',
      },
      sending: false,

      setOpen: (open) => set({ open }),
      toggle: () => set((s) => ({ open: !s.open })),

      addMessage: (message) => set((s) => ({
        messages: [...s.messages, message],
      })),
      updateMessage: (id, updates) => set((s) => ({
        messages: s.messages.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        ),
      })),
      clearMessages: () => set({ messages: [] }),

      setConfig: (partial) => set((s) => ({
        config: { ...s.config, ...partial },
      })),
      setSending: (sending) => set({ sending }),
    }),
    {
      name: 'api2ui-chat',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
        // Don't persist messages or open state
      }),
    }
  )
)
