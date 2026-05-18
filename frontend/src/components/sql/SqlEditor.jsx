import { Clipboard, Download } from 'lucide-react'
import { useMemo } from 'react'

export default function SqlEditor({ sql, onChange }) {
  const formattedSql = useMemo(() => sql?.trim() || '', [sql])

  const copyToClipboard = async () => {
    if (!formattedSql) return
    await navigator.clipboard.writeText(formattedSql)
  }

  return (
    <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-sm font-semibold text-ink-900">Generated SQL</p>
          <p className="text-xs text-ink-500">Edit the query before execution.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyToClipboard}
            className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-surface-100"
          >
            <Clipboard className="w-4 h-4" /> Copy
          </button>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([formattedSql], { type: 'text/sql' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = 'query.sql'
              link.click()
              URL.revokeObjectURL(url)
            }}
            className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-surface-100"
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      </div>
      <textarea
        value={formattedSql}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder="AI-generated SQL appears here once you ask a question."
        className="min-h-[180px] w-full resize-none rounded-3xl border border-surface-200 bg-surface-50 px-4 py-4 text-sm leading-6 text-ink-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  )
}
