import { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Send, Zap, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const QUERY_TEMPLATES = [
  { icon: '📊', label: 'Show top 10 customers by revenue', prompt: 'Show me the top 10 customers by revenue' },
  { icon: '📈', label: 'Monthly sales growth', prompt: 'Generate SQL for monthly sales analysis' },
  { icon: '🔍', label: 'Find inactive users', prompt: 'Write a query to find inactive users' },
  { icon: '💹', label: 'Product performance', prompt: 'Analyze product performance metrics' },
]

export default function SqlInputBox({ onSubmit, disabled, selectedDb }) {
  const [query, setQuery] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)

  const handleSubmit = (e) => {
    e?.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setQuery('')
    setShowTemplates(false)
  }

  const handleTemplate = (template) => {
    setQuery(template.prompt)
    setShowTemplates(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3">
      {/* Templates */}
      {showTemplates && (
        <div className="grid gap-2 sm:grid-cols-2">
          {QUERY_TEMPLATES.map((template, i) => (
            <button
              key={i}
              onClick={() => handleTemplate(template)}
              className="rounded-xl border border-surface-200 bg-white p-3 text-left text-sm transition hover:border-brand-300 hover:bg-brand-50"
            >
              <span className="text-lg">{template.icon}</span>
              <p className="font-medium text-ink-900 mt-2">{template.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-surface-200 bg-white shadow-card-lg overflow-hidden"
      >
        <TextareaAutosize
          className="w-full px-5 py-4 resize-none text-sm text-ink-900 placeholder-ink-400 focus:outline-none bg-transparent max-h-56 leading-relaxed"
          placeholder={
            selectedDb
              ? "Ask a question: 'Show me top 10 customers...' or paste SQL"
              : 'Connect a database to start writing queries'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || !selectedDb}
          minRows={3}
          maxRows={8}
        />

        <div className="flex items-center justify-between gap-3 border-t border-surface-100 bg-surface-50 px-5 py-3">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            disabled={disabled || !selectedDb}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-ink-600 hover:bg-white hover:text-brand-600 transition disabled:text-ink-300 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            Templates
          </button>

          <div className="flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(query)
                  toast.success('Copied to clipboard')
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-ink-600 hover:bg-surface-100 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim() || disabled || !selectedDb}
              className={
                query.trim() && !disabled && selectedDb
                  ? 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-medium transition hover:bg-brand-700'
                  : 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-200 text-ink-400 font-medium cursor-not-allowed'
              }
              title="Send (Ctrl+Enter)"
            >
              <Send className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>
      </form>

      <p className="text-xs text-ink-400 text-center">
        💡 Describe your analysis in natural language, or paste SQL directly
      </p>
    </div>
  )
}
