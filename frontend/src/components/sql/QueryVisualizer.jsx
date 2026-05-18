export default function QueryVisualizer({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-ink-900">Query insights</p>
        <p className="mt-3 text-sm text-ink-500">Run a query to see visualization and metrics.</p>
      </div>
    )
  }

  const numericHeaders = Object.keys(results[0]).filter((key) => typeof results[0][key] === 'number')
  const valueHeader = numericHeaders[0]
  const topRows = results.slice(0, 5)
  const maxValue = Math.max(...topRows.map((row) => Number(row[valueHeader] || 0))) || 1

  return (
    <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-ink-900">Query insights</p>
          <p className="text-xs text-ink-500">Automatically generated from your latest result set.</p>
        </div>
      </div>

      {valueHeader ? (
        <div className="space-y-4">
          {topRows.map((row, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm text-ink-600">
                <span>{row[Object.keys(row)[0]] ?? `Row ${index + 1}`}</span>
                <span>{row[valueHeader]}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${Math.round((Number(row[valueHeader] || 0) / maxValue) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-500">No numeric column found to visualize.</p>
      )}
    </div>
  )
}
