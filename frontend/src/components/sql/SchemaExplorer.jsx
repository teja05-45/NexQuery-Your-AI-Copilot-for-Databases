import { ChevronDown, ChevronRight, Database, Table } from 'lucide-react'
import { useState } from 'react'

const MOCK_SCHEMA = {
  tables: [
    {
      name: 'customers',
      columns: ['id', 'name', 'email', 'created_at', 'status'],
    },
    {
      name: 'orders',
      columns: ['id', 'customer_id', 'amount', 'order_date', 'status'],
    },
    {
      name: 'products',
      columns: ['id', 'name', 'price', 'category', 'stock'],
    },
  ],
}

export default function SchemaExplorer({ schema }) {
  const [expandedTable, setExpandedTable] = useState(null)
  const schemaTables = schema?.tables ?? MOCK_SCHEMA.tables

  const toggleTable = (tableName) => {
    setExpandedTable(expandedTable === tableName ? null : tableName)
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-100 bg-surface-50">
        <p className="text-sm font-semibold text-ink-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-600" />
          Database Schema
        </p>
      </div>

      <div className="divide-y divide-surface-100 max-h-96 overflow-y-auto">
        {MOCK_SCHEMA.tables.map((table) => (
          <div key={table.name}>
            <button
              onClick={() => toggleTable(table.name)}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-surface-50 transition text-left"
            >
              {expandedTable === table.name ? (
                <ChevronDown className="w-4 h-4 text-ink-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-ink-500" />
              )}
              <Table className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-medium text-ink-900">{table.name}</span>
              <span className="ml-auto text-xs text-ink-400">{table.columns.length} cols</span>
            </button>

            {expandedTable === table.name && (
              <div className="bg-surface-50 px-4 py-2 space-y-1">
                {table.columns.map((col) => (
                  <div
                    key={`${table.name}-${col}`}
                    className="py-1.5 pl-8 text-sm text-ink-700 hover:text-brand-600 cursor-pointer transition"
                  >
                    • {col}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
