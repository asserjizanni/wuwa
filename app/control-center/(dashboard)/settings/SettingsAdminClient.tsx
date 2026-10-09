'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Save, Shield, HardDrive, Globe,
  CheckCircle2, RefreshCw, KeyRound, Loader2, Database
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsAdminClient() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    wuwaflex_url: 'https://wuwaflex.com/',
    site_title: 'Wuthering Waves Builds Hub',
    site_description: 'Elite resonator guides, verified builds, and embedded WuwaFlex gear optimizer.',
    max_upload_size_mb: '100',
    maintenance_mode: 'false',
  })

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(prev => ({
          ...prev,
          ...(data.settings || {}),
        }))
      }
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed to update settings')
      toast.success('System settings saved successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-primary" />
          Control Center Settings
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure external embeds, storage limits, and security preferences.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* WuwaFlex Embed Config */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            WuwaFlex Builder Embed
          </h2>
          <p className="text-xs text-gray-400">
            Control the iframe target destination for the public /builder route.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
              WuwaFlex Target URL
            </label>
            <input
              type="url"
              required
              value={settings.wuwaflex_url}
              onChange={e => setSettings({ ...settings, wuwaflex_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Site Metadata Config */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Public Hub Metadata
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                Site Title
              </label>
              <input
                type="text"
                required
                value={settings.site_title}
                onChange={e => setSettings({ ...settings, site_title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                Default Meta Description
              </label>
              <textarea
                rows={3}
                value={settings.site_description}
                onChange={e => setSettings({ ...settings, site_description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Upload Limits & Storage */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            Storage & Processing Thresholds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                Max PDF Upload (MB)
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={settings.max_upload_size_mb}
                onChange={e => setSettings({ ...settings, max_upload_size_mb: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                Dedicated Directory Tree
              </label>
              <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>storage/characters/[slug]/...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  )
}
