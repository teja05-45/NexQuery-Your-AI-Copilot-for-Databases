import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Database, Code2, BarChart3, ArrowRight } from 'lucide-react'
import ChatMessage from './ChatMessage'
import useChatStore from '@/store/chatStore'

const WELCOME_PROMPTS = [
  { icon: Code2, text: 'Show revenue by region for the last quarter' },
  { icon: BarChart3, text: 'Find top-selling products with declining margin' },
  { icon: Database, text: 'Compare monthly active users over time' },
  { icon: Sparkles, text: 'Analyze churn trends by customer segment' },
]

export default function ChatWindow({ onSend }) {
  const { messages, isStreaming, streamingContent, isLoadingMessages } = useChatStore()
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm text-ink-500">Loading session...</p>
        </div>
      </div>
    )
  }

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-surface-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center max-w-2xl w-full"
        >
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Code2 className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl font-display font-bold text-ink-900 mb-3">
            Generate SQL from natural language
          </h2>
          <p className="text-ink-600 text-base mb-10 leading-relaxed max-w-xl mx-auto">
            Describe your analytics need in plain English, and the AI will generate optimized SQL queries instantly.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {WELCOME_PROMPTS.map((prompt, i) => {
              const Icon = prompt.icon
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  onClick={() => onSend(prompt.text)}
                  className="p-4 rounded-xl border border-surface-200 bg-white hover:border-brand-300 hover:bg-brand-50 text-left transition-all group shadow-sm hover:shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-ink-900 group-hover:text-brand-700 transition line-clamp-2">
                      {prompt.text}
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Database,
                title: 'Schema-Aware',
                desc: 'Understands your database structure',
              },
              {
                icon: Code2,
                title: 'Optimized SQL',
                desc: 'Generates clean, efficient queries',
              },
              {
                icon: BarChart3,
                title: 'Results Ready',
                desc: 'Preview and export results instantly',
              },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="rounded-lg border border-surface-200 bg-white p-4">
                  <Icon className="w-5 h-5 text-brand-600 mb-3" />
                  <p className="font-semibold text-ink-900 text-sm mb-1">{feature.title}</p>
                  <p className="text-xs text-ink-600">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-surface-50">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {isStreaming && (
          <ChatMessage
            message={{ id: 'streaming', role: 'assistant', content: streamingContent }}
            isStreaming
            streamingContent={streamingContent}
          />
        )}

        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  )
}
