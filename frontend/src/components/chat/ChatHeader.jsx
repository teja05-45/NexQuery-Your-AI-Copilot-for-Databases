import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, ChevronDown, Brain, Database } from 'lucide-react'
import useChatStore from '@/store/chatStore'
import clsx from 'clsx'

const PROVIDERS = [
  { value: 'groq', label: 'Groq', icon: Database, color: 'text-emerald-600' },
  { value: 'gemini', label: 'Gemini', icon: Brain, color: 'text-blue-600' },
]

export default function ChatHeader({ onToggleSidebar, sidebarCollapsed, conversationTitle }) {
  const { llmProvider, setLlmProvider } = useChatStore()
  const [showDropdown, setShowDropdown] = useState(false)

  const current = PROVIDERS.find((p) => p.value === llmProvider) || PROVIDERS[0]
  const Icon = current.icon

  return (
    <header className="h-14 border-b border-surface-100 bg-white/90 backdrop-blur-sm flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        {sidebarCollapsed && (
          <button onClick={onToggleSidebar} className="btn-ghost p-2">
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-2">
          {conversationTitle ? (
            <span className="text-sm font-medium text-ink-700 truncate max-w-[240px] sm:max-w-xs">
              {conversationTitle}
            </span>
          ) : (
            <span className="text-sm font-medium text-ink-500">SQL session</span>
          )}
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50 transition-all text-sm font-medium text-ink-700"
        >
          <Icon className={clsx('w-3.5 h-3.5', current.color)} />
          <span>{current.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
        </button>

        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-surface-200 shadow-card-lg overflow-hidden z-50"
          >
            {PROVIDERS.map((provider) => {
              const PIcon = provider.icon
              return (
                <button
                  key={provider.value}
                  onClick={() => {
                    setLlmProvider(provider.value)
                    setShowDropdown(false)
                  }}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-surface-50 transition-colors text-left',
                    llmProvider === provider.value
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-ink-700'
                  )}
                >
                  <PIcon className={clsx('w-4 h-4', provider.color)} />
                  {provider.label}
                  {llmProvider === provider.value && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </div>
    </header>
  )
}
