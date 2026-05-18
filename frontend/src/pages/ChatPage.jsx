import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import ChatHeader from '@/components/chat/ChatHeader'
import ChatWindow from '@/components/chat/ChatWindow'
import SqlInputBox from '@/components/sql/SqlInputBox'
import SqlEditor from '@/components/sql/SqlEditor'
import QueryResults from '@/components/sql/QueryResults'
import QueryVisualizer from '@/components/sql/QueryVisualizer'
import SchemaExplorer from '@/components/sql/SchemaExplorer'
import useChatStore from '@/store/chatStore'

const initialDatabases = [
  {
    id: 1,
    name: 'Analytics Warehouse',
    type: 'postgresql',
    status: 'connected',
    description: 'Production reporting dataset',
    lastConnected: '2m ago',
  },
  {
    id: 2,
    name: 'Customer CRM',
    type: 'mysql',
    status: 'connected',
    description: 'CRM analytics database',
    lastConnected: '5m ago',
  },
]

export default function ChatPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [databases] = useState(initialDatabases)
  const [selectedDb, setSelectedDb] = useState(initialDatabases[0])
  const [editedSql, setEditedSql] = useState('')

  const {
    setActiveConversation,
    clearActiveConversation,
    sendMessage,
    isStreaming,
    conversations,
    activeConversationId,
  } = useChatStore()

  useEffect(() => {
    if (conversationId) {
      setActiveConversation(Number(conversationId))
    } else {
      clearActiveConversation()
    }
  }, [conversationId])

  const currentConv = conversations.find(
    (c) => String(c.id) === String(activeConversationId)
  )

  const lastAssistantMessage = useMemo(() => {
    const messages = currentConv?.messages || []
    return messages.slice().reverse().find((msg) => msg.role === 'assistant')?.content || ''
  }, [currentConv])

  useEffect(() => {
    if (lastAssistantMessage) {
      setEditedSql(lastAssistantMessage)
    }
  }, [lastAssistantMessage])

  const resultSet = currentConv?.results || []
  const resultColumns = resultSet.length ? Object.keys(resultSet[0]) : []

  const handleSend = async (message) => {
    await sendMessage(message)
    if (!conversationId && activeConversationId) {
      navigate(`/chat/${activeConversationId}`, { replace: true })
    }
  }

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ChatHeader
          onToggleSidebar={() => setSidebarCollapsed(false)}
          sidebarCollapsed={sidebarCollapsed}
          conversationTitle={currentConv?.title || 'SQL session'}
        />

        <div className="flex-1 overflow-hidden">
          <div className="grid min-h-full grid-cols-1 xl:grid-cols-[300px_1fr_360px] gap-6 p-4 overflow-hidden">
            <aside className="hidden xl:flex flex-col gap-6">
              <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-ink-900">Connected database</p>
                <p className="mt-2 text-sm text-ink-500">Current source used for query generation.</p>
                <div className="mt-5 rounded-3xl border border-surface-200 bg-surface-50 p-4">
                  <p className="font-semibold text-ink-900">{selectedDb?.name}</p>
                  <p className="text-xs text-ink-500 mt-1">{selectedDb?.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-600">
                    <span className="rounded-full bg-success-50 px-3 py-1 text-success-700">Connected</span>
                    <span>{selectedDb?.lastConnected}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDb(databases[0])}
                    className="mt-4 w-full rounded-2xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    Switch source
                  </button>
                </div>
              </div>
              <SchemaExplorer
                schema={{
                  name: 'Analytics warehouse',
                  tables: [
                    { name: 'orders', columns: ['order_id', 'customer_id', 'amount', 'order_date'] },
                    { name: 'customers', columns: ['customer_id', 'name', 'region', 'lifetime_value'] },
                    { name: 'products', columns: ['product_id', 'name', 'category', 'price'] },
                  ],
                }}
              />
            </aside>

            <section className="flex flex-col gap-6 overflow-hidden">
              <div className="rounded-3xl border border-surface-200 bg-white p-4 shadow-sm flex-1 overflow-hidden">
                <ChatWindow onSend={handleSend} />
              </div>

              <SqlEditor sql={editedSql} onChange={setEditedSql} />
            </section>

            <aside className="hidden xl:flex flex-col gap-6">
              <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm overflow-hidden">
                <p className="text-sm font-semibold text-ink-900">Query results</p>
                <p className="text-xs text-ink-500 mt-1">Review the dataset returned by your latest query.</p>
                <div className="mt-5">
                  <QueryResults results={resultSet} columns={resultColumns} />
                </div>
              </div>
              <QueryVisualizer results={resultSet} />
            </aside>
          </div>
        </div>

        <div className="border-t border-surface-100 bg-white p-4">
          <SqlInputBox onSubmit={handleSend} disabled={isStreaming} selectedDb={selectedDb} />
        </div>
      </main>
    </div>
  )
}
