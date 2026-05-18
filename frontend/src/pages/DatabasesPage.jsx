import { useState } from 'react'
import { Database, Plus, CheckCircle } from 'lucide-react'
import DatabaseConnectModal from '@/components/database/DatabaseConnectModal'
import DatabaseCard from '@/components/database/DatabaseCard'
import toast from 'react-hot-toast'

export default function DatabasesPage() {
  const [databases, setDatabases] = useState([
    { id: 1, name: 'Production Analytics', type: 'postgresql', status: 'connected' },
  ])
  const [showModal, setShowModal] = useState(false)

  const handleConnect = (dbConfig) => {
    const newDb = {
      id: Date.now(),
      name: dbConfig.name,
      type: dbConfig.type,
      status: 'connected',
    }
    setDatabases((prev) => [newDb, ...prev])
    toast.success(`Connected to ${dbConfig.name}`)
  }

  const handleDelete = (id) => {
    const db = databases.find((d) => d.id === id)
    setDatabases((prev) => prev.filter((d) => d.id !== id))
    toast.success(`Disconnected from ${db.name}`)
  }

  const handleSelect = (database) => {
    toast.success(`Using database: ${database.name}`)
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-6xl mx-auto px-6 py-12 lg:px-8">
        {/* Header */}
        <div className="space-y-4 mb-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">Data Sources</p>
            <h1 className="mt-4 text-4xl font-display font-bold text-ink-900">Manage Databases</h1>
            <p className="mt-3 text-lg text-ink-600 max-w-3xl">
              Connect, configure, and manage all your SQL databases in one place. Support for PostgreSQL, MySQL, and SQLite.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Database List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-ink-900">Connected Databases</h2>
                <p className="text-sm text-ink-600 mt-1">{databases.length} database{databases.length !== 1 ? 's' : ''} connected</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-medium transition hover:bg-brand-700 shadow-card"
              >
                <Plus className="w-4 h-4" />
                Add Database
              </button>
            </div>

            <div className="space-y-4">
              {databases.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-surface-300 bg-surface-50 p-12 text-center">
                  <Database className="w-12 h-12 text-ink-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-ink-900 mb-2">No databases connected</h3>
                  <p className="text-ink-600 mb-6">Add your first database to get started with SQL queries.</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-medium transition hover:bg-brand-700"
                  >
                    <Plus className="w-4 h-4" />
                    Connect Database
                  </button>
                </div>
              ) : (
                databases.map((db) => (
                  <DatabaseCard
                    key={db.id}
                    database={db}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="rounded-2xl border border-surface-200 bg-white p-6">
              <h3 className="font-semibold text-ink-900 mb-4">Connection Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-700">Connected</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success-50 text-success-700 text-xs font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    {databases.filter((d) => d.status === 'connected').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Connection Types */}
            <div className="rounded-2xl border border-surface-200 bg-white p-6">
              <h3 className="font-semibold text-ink-900 mb-4">Supported Databases</h3>
              <div className="space-y-3">
                {[
                  { icon: '🐘', name: 'PostgreSQL', desc: 'Production-ready' },
                  { icon: '🐬', name: 'MySQL', desc: 'Widely used' },
                  { icon: '📁', name: 'SQLite', desc: 'File-based' },
                ].map((db, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-50">
                    <span className="text-lg">{db.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{db.name}</p>
                      <p className="text-xs text-ink-600">{db.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Help */}
            <div className="rounded-2xl border border-surface-200 bg-white p-6">
              <h3 className="font-semibold text-ink-900 mb-3">Connection Tips</h3>
              <ul className="text-sm text-ink-600 space-y-2 list-disc list-inside">
                <li>Use read-only users when possible</li>
                <li>Test connections before use</li>
                <li>Keep credentials secure</li>
                <li>Use connection pooling in production</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      <DatabaseConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnect={handleConnect}
      />
    </div>
  )
}
