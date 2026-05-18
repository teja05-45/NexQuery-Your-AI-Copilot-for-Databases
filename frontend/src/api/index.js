import apiClient from './client'

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  refresh: (token) => apiClient.post('/auth/refresh', { refresh_token: token }),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (data) => apiClient.put('/auth/me', data),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
  logout: () => apiClient.post('/auth/logout'),
}

// ─── Conversations ────────────────────────────────────────────────────────────
export const conversationsAPI = {
  list: (params) => apiClient.get('/conversations', { params }),
  create: (data) => apiClient.post('/conversations', data),
  get: (id) => apiClient.get(`/conversations/${id}`),
  update: (id, data) => apiClient.put(`/conversations/${id}`, data),
  delete: (id) => apiClient.delete(`/conversations/${id}`),
  getMessages: (id, params) => apiClient.get(`/conversations/${id}/messages`, { params }),
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatAPI = {
  send: (data) => apiClient.post('/chat', data),
  // Streaming handled via native fetch (SSE)
}

// ─── Files ────────────────────────────────────────────────────────────────────
export const filesAPI = {
  upload: (formData) =>
    apiClient.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: () => apiClient.get('/files'),
  get: (id) => apiClient.get(`/files/${id}`),
  index: (id) => apiClient.post(`/files/${id}/index`),
  delete: (id) => apiClient.delete(`/files/${id}`),
}

// ─── Voice ────────────────────────────────────────────────────────────────────
export const voiceAPI = {
  transcribe: (formData) =>
    apiClient.post('/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  synthesize: (text) => apiClient.post('/voice/synthesize', { text }),
}

// ─── Streaming chat via native fetch ─────────────────────────────────────────
export async function* streamChat(data) {
  const token = localStorage.getItem('access_token')
  const base = import.meta.env.VITE_API_URL || '/api/v1'

  const response = await fetch(`${base}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Stream request failed')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') return
        try {
          yield JSON.parse(raw)
        } catch {
          // Ignore malformed chunks
        }
      }
    }
  }
}
