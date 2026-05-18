import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { User, Sparkles, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={copy}
      className="p-1.5 rounded-md hover:bg-surface-100 text-ink-500 transition-colors"
      title="Copy code"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function CodeBlock({ language, children }) {
  const code = String(children).replace(/\n$/, '')
  return (
    <div className="relative group rounded-xl overflow-hidden my-3 border border-surface-200">
      <div className="flex items-center justify-between px-4 py-2 bg-ink-900">
        <span className="text-xs text-white/40 font-mono font-medium">
          {language || 'code'}
        </span>
        <CopyButton text={code} />
      </div>
      <SyntaxHighlighter
        style={oneLight}
        language={language || 'text'}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0, fontSize: '13px' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export default function ChatMessage({ message, isStreaming = false, streamingContent = '' }) {
  const isUser = message.role === 'user'
  const content = isStreaming ? streamingContent : message.content
  const [msgCopied, setMsgCopied] = useState(false)

  const copyMessage = () => {
    navigator.clipboard.writeText(content || '')
    setMsgCopied(true)
    setTimeout(() => setMsgCopied(false), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={clsx('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-ink-900 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shadow-brand">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      <div className={clsx('flex-1 min-w-0', isUser ? 'flex flex-col items-end' : '')}>
        <div
          className={clsx(
            'max-w-2xl rounded-2xl px-4 py-3',
            isUser
              ? 'bg-ink-900 text-white rounded-tr-sm'
              : 'bg-white border border-surface-200 rounded-tl-sm shadow-card'
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose-chat">
              {isStreaming && !content ? (
                <div className="flex items-center gap-1.5 py-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-brand-400 animate-typing"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <CodeBlock language={match[1]}>{children}</CodeBlock>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                    pre: ({ children }) => <>{children}</>,
                  }}
                >
                  {content}
                </ReactMarkdown>
              )}
              {isStreaming && content && <span className="typing-cursor" />}
            </div>
          )}
        </div>

        <div
          className={clsx(
            'flex items-center gap-2 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity',
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          {message.created_at && (
            <span className="text-xs text-ink-400">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
          )}
          {!isUser && (
            <button
              onClick={copyMessage}
              className="text-xs text-ink-400 hover:text-ink-600 flex items-center gap-1 transition-colors"
            >
              {msgCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {msgCopied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
