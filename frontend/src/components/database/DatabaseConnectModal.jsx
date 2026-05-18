import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Database, Check, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const DB_TYPES = [
  { id: 'sqlite', label: 'SQLite', icon: '📁' },
  { id: 'postgresql', label: 'PostgreSQL', icon: '🐘' },
  { id: 'mysql', label: 'MySQL', icon: '🐬' },
]

export default function DatabaseConnectModal({ isOpen, onClose, onConnect }) {
  const [step, setStep] = useState('type') // type, form, test
  const [selectedType, setSelectedType] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tested, setTested] = useState(false)
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({
    name: '',
    host: '',
    port: '',
    username: '',
    password: '',
    database: '',
  })

  if (!isOpen) return null

  const handleSelectType = (typeId) => {
    setSelectedType(typeId)
    setStep('form')
    setFile(null)
    setForm({
      name: '',
      host: '',
      port: typeId === 'postgresql' ? '5432' : '3306',
      username: '',
      password: '',
      database: '',
    })
    setTested(false)
  }

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return
    if (!uploadedFile.name.endsWith('.db')) {
      toast.error('Please upload a valid .db file')
      return
    }
    setFile(uploadedFile)
  }

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleTestConnection = async () => {
    setLoading(true)
    try {
      // Simulate connection test
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setTested(true)
      toast.success('Connection successful!')
    } catch (error) {
      toast.error('Connection failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    if (selectedType === 'sqlite') {
      if (!file || !form.name) {
        toast.error('Please select a file and name')
        return
      }
      onConnect({
        type: 'sqlite',
        name: form.name,
        file: file,
      })
    } else {
      if (!form.name || !form.host || !form.database) {
        toast.error('Please fill in all required fields')
        return
      }
      if (!tested) {
        toast.error('Please test the connection first')
        return
      }
      onConnect({
        type: selectedType,
        name: form.name,
        host: form.host,
        port: form.port,
        username: form.username,
        password: form.password,
        database: form.database,
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-200">
          <div>
            <h2 className="text-2xl font-semibold text-ink-900">Connect Database</h2>
            <p className="text-sm text-ink-500 mt-1">
              {step === 'type' && 'Choose your database type'}
              {step === 'form' && `Configure ${selectedType?.toUpperCase()} connection`}
              {step === 'test' && 'Test your connection'}
            </p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'type' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {DB_TYPES.map((dbType) => (
                <button
                  key={dbType.id}
                  onClick={() => handleSelectType(dbType.id)}
                  className="rounded-2xl border-2 border-surface-200 bg-white p-6 text-center transition hover:border-brand-400 hover:bg-brand-50"
                >
                  <div className="text-3xl mb-3">{dbType.icon}</div>
                  <p className="font-semibold text-ink-900">{dbType.label}</p>
                  <p className="text-xs text-ink-500 mt-2">
                    {dbType.id === 'sqlite' && 'Upload .db file'}
                    {dbType.id === 'postgresql' && 'Remote connection'}
                    {dbType.id === 'mysql' && 'Remote connection'}
                  </p>
                </button>
              ))}
            </motion.div>
          )}

          {step === 'form' && selectedType && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {selectedType === 'sqlite' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-3">
                      Database Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="My Analytics Database"
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-3">
                      SQLite Database File (.db)
                    </label>
                    <div className="relative rounded-xl border-2 border-dashed border-surface-300 bg-surface-50 p-8 text-center hover:border-brand-300 transition cursor-pointer group">
                      <input
                        type="file"
                        accept=".db,.sqlite,.sqlite3"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="w-6 h-6 text-ink-400 mx-auto mb-2 group-hover:text-brand-500 transition" />
                      {file ? (
                        <>
                          <p className="text-sm font-medium text-ink-900">{file.name}</p>
                          <p className="text-xs text-ink-500 mt-1">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-ink-900">Drop file here or click</p>
                          <p className="text-xs text-ink-500 mt-1">Maximum size: 100 MB</p>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('test')}
                    disabled={!file || !form.name}
                    className="w-full mt-6 px-4 py-3 rounded-xl bg-brand-600 text-white font-medium transition hover:bg-brand-700 disabled:bg-surface-300 disabled:text-ink-400 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-3">
                      Connection Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Production Analytics"
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 transition"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-3">
                        Host
                      </label>
                      <input
                        type="text"
                        value={form.host}
                        onChange={(e) => handleFormChange('host', e.target.value)}
                        placeholder="localhost"
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-3">
                        Port
                      </label>
                      <input
                        type="text"
                        value={form.port}
                        onChange={(e) => handleFormChange('port', e.target.value)}
                        placeholder={selectedType === 'postgresql' ? '5432' : '3306'}
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-3">
                      Database Name
                    </label>
                    <input
                      type="text"
                      value={form.database}
                      onChange={(e) => handleFormChange('database', e.target.value)}
                      placeholder="analytics_db"
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 transition"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-3">
                        Username
                      </label>
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) => handleFormChange('username', e.target.value)}
                        placeholder="admin"
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-3">
                        Password
                      </label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => handleFormChange('password', e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 transition"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleTestConnection}
                    disabled={loading || !form.host || !form.database}
                    className="w-full mt-6 px-4 py-3 rounded-xl border-2 border-brand-200 bg-brand-50 text-brand-700 font-medium transition hover:bg-brand-100 disabled:border-surface-200 disabled:bg-surface-50 disabled:text-ink-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Testing...' : 'Test Connection'}
                  </button>

                  {tested && (
                    <div className="flex items-center gap-3 rounded-xl bg-success-50 border border-success-200 p-3 text-sm text-success-700">
                      <Check className="w-5 h-5" />
                      Connection successful!
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-surface-200 bg-surface-50 p-6">
          <button
            onClick={() => (step === 'form' ? setStep('type') : onClose())}
            className="px-6 py-2 rounded-xl border border-surface-300 text-ink-700 font-medium transition hover:bg-surface-100"
          >
            {step === 'form' ? 'Back' : 'Cancel'}
          </button>
          {step === 'form' && (
            <button
              onClick={handleConnect}
              disabled={
                selectedType === 'sqlite'
                  ? !file || !form.name
                  : !tested || !form.name || !form.host || !form.database
              }
              className="px-6 py-2 rounded-xl bg-brand-600 text-white font-medium transition hover:bg-brand-700 disabled:bg-surface-300 disabled:text-ink-400 disabled:cursor-not-allowed"
            >
              Connect Database
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
