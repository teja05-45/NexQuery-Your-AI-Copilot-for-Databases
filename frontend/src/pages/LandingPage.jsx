import { Link } from 'react-router-dom'
import { Sparkles, Database, LayoutDashboard, Terminal, ShieldCheck, Code2, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-surface-100 text-ink-900">
      <div className="max-w-7xl mx-auto px-6 py-20 lg:px-8">
        {/* Hero Section */}
        <div className="grid gap-16 lg:grid-cols-2 items-center mb-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full bg-brand-100 px-4 py-2 text-brand-700 text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              AI-Powered SQL Generation
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-display font-bold tracking-tight text-ink-900 leading-tight">
                Write SQL with natural language
              </h1>
              <p className="text-xl text-ink-600 leading-relaxed max-w-xl">
                Transform plain English into optimized SQL queries. Connect any database and execute analytics instantly with AI assistance.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/databases"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-brand-600 text-white font-semibold transition hover:bg-brand-700 shadow-brand"
              >
                <Database className="w-5 h-5 mr-2" />
                Connect Database
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-brand-200 bg-white text-brand-700 font-semibold transition hover:bg-brand-50"
              >
                Sign In
              </Link>
            </div>

            {/* Feature List */}
            <div className="grid gap-3 sm:grid-cols-2 pt-4">
              <div className="flex items-start gap-3">
                <Code2 className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink-900">Natural Language Queries</p>
                  <p className="text-sm text-ink-600">Ask questions like a human</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink-900">Instant SQL Generation</p>
                  <p className="text-sm text-ink-600">Get results in seconds</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink-900">Multiple Databases</p>
                  <p className="text-sm text-ink-600">PostgreSQL, MySQL, SQLite</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink-900">Secure & Private</p>
                  <p className="text-sm text-ink-600">Your data stays with you</p>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Card */}
          <div className="rounded-2xl border border-surface-200 bg-white p-8 shadow-xl overflow-hidden">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-brand-600 font-semibold">Example Workflow</p>
                <h3 className="text-2xl font-bold text-ink-900 mt-3">Query Generation</h3>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-brand-50 border border-brand-200 p-4">
                  <p className="text-xs uppercase tracking-[0.1em] text-brand-700 font-semibold mb-2">Natural Language</p>
                  <p className="text-sm text-ink-900 leading-relaxed">
                    "Show me top 10 customers by revenue for the last 6 months"
                  </p>
                </div>

                <div className="flex justify-center">
                  <Zap className="w-5 h-5 text-brand-600" />
                </div>

                <div className="rounded-xl bg-surface-50 border border-surface-200 p-4">
                  <p className="text-xs uppercase tracking-[0.1em] text-ink-600 font-semibold mb-2">Generated SQL</p>
                  <pre className="text-xs text-ink-800 font-mono overflow-x-auto">
{`SELECT customer_id, customer_name,
  SUM(amount) as total_revenue
FROM orders
WHERE order_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
GROUP BY customer_id
ORDER BY total_revenue DESC
LIMIT 10`}
                  </pre>
                </div>
              </div>

              <button className="w-full px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold transition hover:bg-brand-700">
                Try Now
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-ink-900">
              Everything you need for SQL analytics
            </h2>
            <p className="text-lg text-ink-600 max-w-2xl mx-auto">
              Built for data analysts, engineers, and business intelligence teams
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Database className="w-6 h-6 text-brand-600" />,
                title: 'Database Connections',
                description: 'Connect to PostgreSQL, MySQL, SQLite, and more. Manage multiple databases seamlessly.'
              },
              {
                icon: <Code2 className="w-6 h-6 text-brand-600" />,
                title: 'SQL Code Editor',
                description: 'Write, edit, and execute SQL with syntax highlighting and intelligent suggestions.'
              },
              {
                icon: <Zap className="w-6 h-6 text-brand-600" />,
                title: 'Query Templates',
                description: 'Start with pre-built templates for common analytics patterns and workflows.'
              },
              {
                icon: <Terminal className="w-6 h-6 text-brand-600" />,
                title: 'Query History',
                description: 'Keep all your queries organized and easily recall past analysis sessions.'
              },
              {
                icon: <LayoutDashboard className="w-6 h-6 text-brand-600" />,
                title: 'Results Visualization',
                description: 'Export results as CSV or view in interactive tables with pagination.'
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-brand-600" />,
                title: 'Secure & Fast',
                description: 'Enterprise-grade security with minimal latency for real-time queries.'
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl border border-surface-200 bg-white p-6 hover:border-brand-300 hover:shadow-card-lg transition">
                <div className="mb-4 p-3 rounded-xl bg-brand-50 w-fit">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-ink-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-ink-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-16 text-center text-white">
          <h2 className="text-4xl font-display font-bold mb-4">Ready to analyze with SQL?</h2>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Connect your database and start writing SQL with AI assistance in minutes.
          </p>
          <Link
            to="/databases"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-semibold transition hover:bg-brand-50 shadow-lg"
          >
            <Database className="w-5 h-5" />
            Open SQL Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
