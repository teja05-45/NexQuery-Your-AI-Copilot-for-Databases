import { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Send } from 'lucide-react'

export default function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e?.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setMessage('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="p-4 border-t border-surface-100 bg-white/90 backdrop-blur-sm">
      <form className="flex items-end gap-3 bg-white rounded-2xl border border-surface-200 shadow-card px-4 py-3" onSubmit={handleSubmit}>
        <TextareaAutosize
          className="flex-1 resize-none text-sm text-ink-900 placeholder-ink-400 focus:outline-none bg-transparent max-h-48 leading-relaxed"
          placeholder="Ask the SQL assistant to write or optimize a query..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          minRows={1}
          maxRows={6}
          autoFocus
        />

        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className={message.trim() && !disabled ? 'btn-primary rounded-xl p-3' : 'inline-flex items-center justify-center rounded-xl p-3 bg-surface-100 text-ink-300 cursor-not-allowed'}
          title="Send query"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
      <p className="text-xs text-ink-400 text-center mt-2">
        Generate SQL, inspect query logic, or ask for data model help.
      </p>
    </div>
  )
}
