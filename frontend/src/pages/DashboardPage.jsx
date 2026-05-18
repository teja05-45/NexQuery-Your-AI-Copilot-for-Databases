import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, Plus, Sparkles, Code2, BarChart3 } from 'lucide-react'
import DatabaseConnectModal from '@/components/database/DatabaseConnectModal'
import DatabaseCard from '@/components/database/DatabaseCard'
import DatabaseSelector from '@/components/database/DatabaseSelector'
import ConnectionStatus from '@/components/database/ConnectionStatus'
import useChatStore from '@/store/chatStore'

const initialDatabases = [
  {
    id: 1,
    name: 'Analytics DB',
    type: 'postgresql',
    status: 'connected',
    description: 'Primary analytics warehouse',
    lastConnected: '2m ago',
  },
  {
    id: 2,
    name: 'Sales Archive',
    type: 'mysql',
    status: 'connected',
    description: 'Historical sales dataset',
    lastConnected: '10m ago',
  },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [databases, setDatabases] = useState(initialDatabases)
  const [selectedDb, setSelectedDb] = useState(initialDatabases[0])
  const {
    conversations,
    fetchConversations,
    createConversation,
  } = useChatStore()

  useEffect(() => {
    fetchConversations()
  }, [])

  const handleNewSession = async () => {
    const conv = await createConversation({ title: 'New SQL session' })
    navigate(`/chat/${conv.id}`)
  }

  const handleConnectDatabase = (dbConfig) => {
    const newDb = {
      id: Date.now(),
      name: dbConfig.name,
      type: dbConfig.type,
      status: 'connected',
      description: `${dbConfig.type.toUpperCase()} connection`,
      lastConnected: 'Just now',
    }
    setDatabases((prev) => [newDb, ...prev])
    setSelectedDb(newDb)
  }

  const handleDeleteDatabase = (id) => {
    setDatabases((prev) => prev.filter((db) => db.id !== id))
    if (selectedDb?.id === id) {
      setSelectedDb(databases[0])
    }
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-6 py-10 lg:px-8">
        <div className="space-y-3 mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">SQL Assistant</p>
          <h1 className="text-4xl font-display font-bold text-ink-900">Analytics Workspace</h1>
          <p className="text-ink-500 max-w-2xl">
            Connect databases, build queries in natural language, and execute analytics with a modern SQL assistant.
          </p>
        </div>

        <div className="grid gap-4 mb-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-surface-200 bg-white p-5 hover:border-brand-200 transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-ink-700">Connected Databases</p>
              <Database className="w-5 h-5 text-brand-600" />
            </div>
            <p className="text-3xl font-bold text-ink-900">{databases.length}</p>
            <p className="text-xs text-ink-500 mt-2">Ready for SQL generation</p>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-5 hover:border-brand-200 transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-ink-700">SQL Sessions</p>
              <Code2 className="w-5 h-5 text-brand-600" />
            </div>
            <p className="text-3xl font-bold text-ink-900">{conversations.length}</p>
            <p className="text-xs text-ink-500 mt-2">Saved analysis sessions</p>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-5 hover:border-brand-200 transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-ink-700">AI Providers</p>
              <BarChart3 className="w-5 h-5 text-brand-600" />
            </div>
            <p className="text-3xl font-bold text-ink-900">2</p>
            <p className="text-xs text-ink-500 mt-2">Groq + Gemini enabled</p>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-5 hover:border-brand-200 transition">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-ink-700">Live Inventory</p>
              <Sparkles className="w-5 h-5 text-brand-600" />
            </div>
            <p className="text-3xl font-bold text-ink-900">{selectedDb?.name}</p>
            <div className="mt-2 flex items-center gap-2">
              <ConnectionStatus status={selectedDb?.status} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-ink-900">Active database</h2>
                  <p className="text-sm text-ink-500">Select the current source for your SQL assistant.</p>
                </div>
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  <Plus className="w-4 h-4" />
                  Connect
                </button>
              </div>
              <DatabaseSelector
                databases={databases}
                selectedDb={selectedDb}
                onSelect={setSelectedDb}
              />
            </div>

            <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ink-900 mb-3">Query starter</h2>
              <p className="text-sm text-ink-500">Use natural language prompts or paste SQL directly in the assistant.</p>
              <div className="mt-5 grid gap-3">
                {[
                  'Show top 10 customers by revenue',
                  'Compare monthly sales to last year',
                  'Find the most profitable product categories',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-ink-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-ink-900">Recent sessions</h2>
                <p className="text-sm text-ink-500">Open past analysis instantly.</p>
              </div>
              <button
                onClick={handleNewSession}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>

            {conversations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-surface-300 bg-surface-50 p-8 text-center">
                <p className="text-sm text-ink-500">No sessions yet. Create your first SQL exploration.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/chat/${conv.id}`)}
                    className="w-full rounded-3xl border border-surface-200 bg-surface-50 p-4 text-left transition hover:bg-white hover:border-brand-300"
                  >
                    <p className="font-medium text-ink-900 truncate">{conv.title || 'SQL session'}</p>
                    <p className="text-xs text-ink-500 mt-1">{new Date(conv.created_at).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <DatabaseConnectModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          onConnect={handleConnectDatabase}
        />
      </div>
    </div>
  )
}
