import { create } from 'zustand'
import { conversationsAPI, streamChat } from '@/api'

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  llmProvider: 'groq',
  totalConversations: 0,
  isLoadingConversations: false,
  isLoadingMessages: false,

  fetchConversations: async (params = {}) => {
    set({ isLoadingConversations: true })
    try {
      const res = await conversationsAPI.list({ page: 1, page_size: 30, ...params })
      set({
        conversations: res.data.conversations,
        totalConversations: res.data.total,
      })
    } finally {
      set({ isLoadingConversations: false })
    }
  },

  setActiveConversation: async (id) => {
    set({ activeConversationId: id, messages: [], isLoadingMessages: true })
    try {
      const res = await conversationsAPI.getMessages(id, { limit: 100 })
      set({ messages: res.data })
    } finally {
      set({ isLoadingMessages: false })
    }
  },

  createConversation: async (data = {}) => {
    const res = await conversationsAPI.create({
      title: 'New SQL session',
      llm_provider: get().llmProvider,
      ...data,
    })
    const conv = res.data
    set((state) => ({
      conversations: [conv, ...state.conversations],
      activeConversationId: conv.id,
      messages: [],
    }))
    return conv
  },

  renameConversation: async (id, title) => {
    await conversationsAPI.update(id, { title })
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    }))
  },

  deleteConversation: async (id) => {
    await conversationsAPI.delete(id)
    set((state) => {
      const remaining = state.conversations.filter((c) => c.id !== id)
      return {
        conversations: remaining,
        activeConversationId:
          state.activeConversationId === id
            ? remaining[0]?.id || null
            : state.activeConversationId,
        messages: state.activeConversationId === id ? [] : state.messages,
      }
    })
  },

  updateConversationTitle: (id, title) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    })),

  sendMessage: async (content) => {
    const { activeConversationId, llmProvider } = get()

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    set((state) => ({
      messages: [...state.messages, tempUserMsg],
      isStreaming: true,
      streamingContent: '',
    }))

    try {
      let conversationId = activeConversationId
      let conversationTitle = null

      const generator = streamChat({
        conversation_id: conversationId,
        message: content,
        stream: true,
        llm_provider: llmProvider,
      })

      let fullContent = ''
      let messageId = null

      for await (const chunk of generator) {
        if (chunk.type === 'meta') {
          conversationId = chunk.conversation_id
          conversationTitle = chunk.conversation_title
          if (!activeConversationId) {
            set({ activeConversationId: conversationId })
          }
          if (conversationTitle) {
            get().updateConversationTitle(conversationId, conversationTitle)
          }
        } else if (chunk.type === 'chunk') {
          fullContent += chunk.content || ''
          set({ streamingContent: fullContent })
        } else if (chunk.type === 'done') {
          messageId = chunk.message_id
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error)
        }
      }

      const assistantMsg = {
        id: messageId || `ai-${Date.now()}`,
        role: 'assistant',
        content: fullContent,
        created_at: new Date().toISOString(),
      }

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isStreaming: false,
        streamingContent: '',
      }))

      if (!activeConversationId) {
        await get().fetchConversations()
      } else if (conversationTitle) {
        get().updateConversationTitle(conversationId, conversationTitle)
      }
    } catch (err) {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `Error: ${err.message || 'Something went wrong. Please try again.'}`,
            is_error: true,
            created_at: new Date().toISOString(),
          },
        ],
        isStreaming: false,
        streamingContent: '',
      }))
    }
  },

  setLlmProvider: (val) => set({ llmProvider: val }),

  clearActiveConversation: () =>
    set({ activeConversationId: null, messages: [], streamingContent: '' }),
}))

export default useChatStore
