import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function QueryResults({ results, columns }) {
  const [page, setPage] = useState(0)
  const itemsPerPage = 10
  const totalPages = Math.ceil((results?.length || 0) / itemsPerPage)
  const start = page * itemsPerPage
  const end = start + itemsPerPage
  const paginatedResults = results?.slice(start, end) || []

  const handleExportCsv = () => {
    if (!results || !columns) return

    let csv = columns.map((col) => `"${col}"`).join(',') + '\n'
    results.forEach((row) => {
      const values = columns.map((col) => {
        const val = row[col]
        if (val === null || val === undefined) return ''
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`
        return val
      })
      csv += values.join(',') + '\n'
    })

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', `results-${Date.now()}.csv`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success('Exported to CSV!')
  }

  if (!results || results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-surface-300 bg-surface-50 p-8 text-center">
        <p className="text-sm text-ink-500">No results to display</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-surface-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                {columns?.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left font-semibold text-ink-900 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map((row, i) => (
                <tr key={i} className="border-b border-surface-100 hover:bg-surface-50 transition">
                  {columns?.map((col) => (
                    <td key={`${i}-${col}`} className="px-4 py-3 text-ink-700 whitespace-nowrap">
                      {row[col] === null || row[col] === undefined ? (
                        <span className="text-ink-300 italic">null</span>
                      ) : typeof row[col] === 'boolean' ? (
                        <span className={row[col] ? 'text-success-600 font-medium' : 'text-ink-400'}>
                          {String(row[col])}
                        </span>
                      ) : (
                        String(row[col]).substring(0, 50)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-surface-200 bg-surface-50">
          <p className="text-sm text-ink-600">
            Showing <span className="font-semibold">{start + 1}</span> to{' '}
            <span className="font-semibold">{Math.min(end, results.length)}</span> of{' '}
            <span className="font-semibold">{results.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="inline-flex items-center p-2 rounded-lg border border-surface-300 text-ink-600 hover:bg-white transition disabled:text-ink-300 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm text-ink-600 min-w-[60px] text-center">
              {page + 1} of {totalPages}
            </p>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center p-2 rounded-lg border border-surface-300 text-ink-600 hover:bg-white transition disabled:text-ink-300 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium transition hover:bg-brand-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      )}
    </div>
  )
}
