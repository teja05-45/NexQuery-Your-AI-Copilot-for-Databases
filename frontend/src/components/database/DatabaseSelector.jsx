import { Database, CheckCircle, AlertCircle } from 'lucide-react'

const DB_ICONS = {
  sqlite: '📁',
  postgresql: '🐘',
  mysql: '🐬',
}

export default function DatabaseSelector({ databases, selectedDb, onSelect }) {
  return (
    <div className="rounded-3xl border border-surface-200 bg-white p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-ink-900">Active database</p>
          <p className="text-xs text-ink-500">Choose where SQL is executed</p>
        </div>
      </div>

      <div className="space-y-3">
        {databases.map((database) => {
          const isSelected = selectedDb?.id === database.id
          return (
            <button
              key={database.id}
              type="button"
              onClick={() => onSelect(database)}
              className={`w-full rounded-3xl border p-4 text-left transition ${
                isSelected ? 'border-brand-300 bg-brand-50' : 'border-surface-200 bg-white hover:border-brand-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl leading-none">{DB_ICONS[database.type] || '🗄️'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink-900 truncate">{database.name}</p>
                    <span className="text-xs uppercase tracking-[0.2em] text-ink-400">{database.type}</span>
                  </div>
                  <p className="text-sm text-ink-500 mt-2 truncate">{database.description || 'Connected database source'}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                {database.status === 'connected' ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-success-600" />
                    <span className="text-success-700">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-alert-600" />
                    <span className="text-alert-700">Disconnected</span>
                  </>
                )}
                <span className="text-ink-400">• Last connected {database.lastConnected}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
