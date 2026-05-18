import { Copy, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function SqlCodeBlock({ code, language = 'sql' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(code))
    element.setAttribute('download', `query-${Date.now()}.${language}`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success('Downloaded!')
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-surface-200 bg-white px-4 py-3">
        <p className="text-xs uppercase tracking-[0.1em] text-ink-500 font-semibold">Generated SQL</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm text-ink-600 hover:bg-surface-100 transition"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm text-ink-600 hover:bg-surface-100 transition"
            title="Download as file"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      <pre className="overflow-x-auto p-4 text-sm text-ink-800 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}
