import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Lock, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/api'
import useAuthStore from '@/store/authStore'
import clsx from 'clsx'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
]

function ProfileTab({ user, onUpdate }) {
  const [form, setForm] = useState({ full_name: user?.full_name || '' })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await authAPI.updateProfile(form)
      onUpdate(res.data)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-ink-900 mb-4">Personal Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Full name</label>
            <input
              className="input-field max-w-sm"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Email address</label>
            <input
              className="input-field max-w-sm bg-surface-50"
              value={user?.email || ''}
              disabled
            />
            <p className="text-xs text-ink-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Username</label>
            <input
              className="input-field max-w-sm bg-surface-50"
              value={user?.username || ''}
              disabled
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSave} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </div>
    </div>
  )
}

function SecurityTab() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = async () => {
    if (form.new_password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (form.new_password.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await authAPI.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      })
      toast.success('Password updated successfully')
      setForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-ink-900 mb-4">Change Password</h3>
      <div className="space-y-4 max-w-sm">
        {['current_password', 'new_password', 'confirm'].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-ink-700 mb-1.5 capitalize">
              {field.replace('_', ' ')}
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          </div>
        ))}
        <button onClick={handleChange} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          Update password
        </button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')

  const tabContent = {
    profile: <ProfileTab user={user} onUpdate={updateUser} />,
    security: <SecurityTab />,
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="btn-ghost py-1.5">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>
        <h1 className="text-base font-semibold text-ink-900">Settings</h1>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <nav className="w-52 flex-shrink-0 space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                    activeTab === tab.id
                      ? 'bg-brand-50 text-brand-700 border border-brand-200'
                      : 'text-ink-600 hover:bg-surface-100 hover:text-ink-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 card p-6"
          >
            {tabContent[activeTab]}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
