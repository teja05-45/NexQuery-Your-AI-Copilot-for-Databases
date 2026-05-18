import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Database, Search, Trash2, Edit2, Check, X,
  ChevronLeft, Sparkles, Settings, LogOut, User, LayoutDashboard, Link2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import useChatStore from '@/store/chatStore'
import useAuthStore from '@/store/authStore'
import clsx from 'clsx'

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const { user, logout } = useAuthStore()
  const {
    conversations,
    fetchConversations,
    setActiveConversation,
    createConversation,
    renameConversation,
    deleteConversation,
  } = useChatStore()

  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const editRef = useRef(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus()
  }, [editingId])

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleNewSession = async () => {
    const conv = await createConversation({ title: 'New SQL session' })
    navigate(`/chat/${conv.id}`)
  }

  const handleSelectConversation = async (id) => {
    await setActiveConversation(id)
    navigate(`/chat/${id}`)
  }

  const startRename = (e, conv) => {
    e.stopPropagation()
    setEditingId(conv.id)
    setEditTitle(conv.title)
  }

  const confirmRename = async (e) => {
    e?.stopPropagation()
    if (editTitle.trim()) {
      await renameConversation(editingId, editTitle.trim())
    }
    setEditingId(null)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (window.confirm('Delete this session?')) {
      await deleteConversation(id)
      if (String(conversationId) === String(id)) navigate('/dashboard')
      toast.success('Session deleted')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 0 : 280 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="h-full bg-white border-r border-surface-200 flex flex-col overflow-hidden flex-shrink-0"
    >
      <div className="flex-1 flex flex-col min-w-[280px]">
        <div className="p-4 border-b border-surface-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-brand">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-base text-ink-900">AI SQL Assistant</span>
            </div>
            <button onClick={onToggle} className="btn-ghost p-1.5">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <button onClick={handleNewSession} className="btn-primary w-full">
            <Plus className="w-4 h-4" />
            New session
          </button>
        </div>

        <div className="px-4 py-3 border-b border-surface-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-ink-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Database className="w-8 h-8 text-ink-300 mx-auto mb-3" />
              <p className="text-sm text-ink-400">
                {search ? 'No sessions found' : 'Create your first SQL session'}
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((conv, idx) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={clsx(
                    'sidebar-item mb-0.5 relative group cursor-pointer',
                    String(conversationId) === String(conv.id) && 'sidebar-item-active'
                  )}
                >
                  <Database className="w-4 h-4 flex-shrink-0 opacity-60" />

                  <div className="flex-1 min-w-0">
                    {editingId === conv.id ? (
                      <input
                        ref={editRef}
                        className="w-full text-sm bg-white border border-brand-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRename()
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <p className="truncate text-sm font-medium leading-tight">{conv.title}</p>
                        <p className="text-xs text-ink-400 mt-0.5">
                          {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                        </p>
                      </>
                    )}
                  </div>

                  <div
                    className={clsx(
                      'flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
                      editingId === conv.id && 'opacity-100'
                    )}
                  >
                    {editingId === conv.id ? (
                      <>
                        <button
                          onClick={confirmRename}
                          className="p-1 rounded hover:bg-surface-200 text-ink-500 hover:text-green-600"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                          className="p-1 rounded hover:bg-surface-200 text-ink-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => startRename(e, conv)}
                          className="p-1 rounded hover:bg-surface-200 text-ink-400 hover:text-ink-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, conv.id)}
                          className="p-1 rounded hover:bg-red-50 text-ink-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="border-t border-surface-100 p-3 space-y-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="sidebar-item w-full text-left"
          >
            <LayoutDashboard className="w-4 h-4 opacity-60" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/databases')}
            className="sidebar-item w-full text-left"
          >
            <Link2 className="w-4 h-4 opacity-60" />
            <span>Databases</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="sidebar-item w-full text-left"
          >
            <Settings className="w-4 h-4 opacity-60" />
            <span>Settings</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-800 truncate">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-ink-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
