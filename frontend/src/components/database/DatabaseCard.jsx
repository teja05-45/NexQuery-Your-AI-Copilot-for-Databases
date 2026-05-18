import { Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const DB_ICONS = {
  sqlite: '📁',
  postgresql: '🐘',
  mysql: '🐬',
}

export default function DatabaseCard({ database, onDelete, onSelect }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${database.name}"?`)) return
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      onDelete(database.id)
      toast.success('Database removed')
    } catch (error) {
      toast.error('Failed to delete')
    } finally {
      setLoading(false)
    }
  }

  const statusOk = database.status === 'connected'

  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 hover:border-brand-300 hover:shadow-card-lg transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-2xl mt-1">{DB_ICONS[database.type] || '🗄️'}</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink-900">{database.name}</p>
            <p className="text-sm text-ink-500 mt-1">{database.type.toUpperCase()}</p>
            <div className="flex items-center gap-2 mt-3">
              {statusOk ? (
                <>
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  <p className="text-xs text-success-600 font-medium">Connected</p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-alert-600" />
                  <p className="text-xs text-alert-600 font-medium">Disconnected</p>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-ink-400 hover:text-alert-600 transition disabled:cursor-not-allowed"
          title="Delete database"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      <button
        onClick={() => onSelect(database)}
        className="w-full mt-4 px-3 py-2 rounded-lg border border-brand-200 bg-brand-50 text-brand-700 text-sm font-medium transition hover:bg-brand-100"
      >
        Use This Database
      </button>
    </div>
  )
}
