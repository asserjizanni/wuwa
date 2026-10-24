'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Search, Edit2, Trash2, Shield, Check, X, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import ImageUploadField from '@/components/admin/ImageUploadField'

interface Weapon {
  id: string
  slug: string
  name: string
  nameAr: string | null
  weaponType: string
  stars: number
  iconUrl: string | null
  baseAtk: number | null
  secondaryStat: string | null
  secondaryStatValue: string | null
  desc: string | null
  descAr: string | null
  isPublished: boolean
}

const WEAPON_TYPES = ['SWORD', 'BROADBLADE', 'PISTOLS', 'GAUNTLETS', 'RECTIFIER']

export default function WeaponsAdminClient({ initialWeapons }: { initialWeapons: Weapon[] }) {
  const [weapons, setWeapons] = useState<Weapon[]>(initialWeapons)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWeapon, setEditingWeapon] = useState<Weapon | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    slug: '',
    weaponType: 'SWORD',
    stars: 5,
    iconUrl: '',
    baseAtk: 587,
    secondaryStat: 'CRIT Rate',
    secondaryStatValue: '24.3%',
    desc: '',
    descAr: '',
    isPublished: true,
  })

  const openCreateModal = () => {
    setEditingWeapon(null)
    setFormData({
      name: '',
      nameAr: '',
      slug: '',
      weaponType: 'SWORD',
      stars: 5,
      iconUrl: '',
      baseAtk: 587,
      secondaryStat: 'CRIT Rate',
      secondaryStatValue: '24.3%',
      desc: '',
      descAr: '',
      isPublished: true,
    })
    setModalOpen(true)
  }

  const openEditModal = (w: Weapon) => {
    setEditingWeapon(w)
    setFormData({
      name: w.name,
      nameAr: w.nameAr || '',
      slug: w.slug,
      weaponType: w.weaponType,
      stars: w.stars,
      iconUrl: w.iconUrl || '',
      baseAtk: w.baseAtk || 500,
      secondaryStat: w.secondaryStat || '',
      secondaryStatValue: w.secondaryStatValue || '',
      desc: w.desc || '',
      descAr: w.descAr || '',
      isPublished: w.isPublished,
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/admin/weapons', {
        method: editingWeapon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingWeapon?.id,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'ظپط´ظ„طھ ط§ظ„ط¹ظ…ظ„ظٹط©')
      }

      const saved = await res.json()
      if (editingWeapon) {
        setWeapons((prev) => prev.map((w) => (w.id === saved.id ? saved : w)))
        toast.success('طھظ… طھط­ط¯ظٹط« ط§ظ„ط³ظ„ط§ط­ ط¨ظ†ط¬ط§ط­')
      } else {
        setWeapons((prev) => [saved, ...prev])
        toast.success('طھظ…طھ ط¥ط¶ط§ظپط© ط§ظ„ط³ظ„ط§ط­ ط¨ظ†ط¬ط§ط­')
      }
      setModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط§ظ„ط­ظپط¸')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (w: Weapon) => {
    if (!confirm(`ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ط§ظ„ط³ظ„ط§ط­ "${w.nameAr || w.name}"طں`)) return

    try {
      const res = await fetch(`/api/admin/weapons?id=${w.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('ظپط´ظ„ ط§ظ„ط­ط°ظپ')

      setWeapons((prev) => prev.filter((item) => item.id !== w.id))
      toast.success('طھظ… ط­ط°ظپ ط§ظ„ط³ظ„ط§ط­ ط¨ظ†ط¬ط§ط­')
    } catch {
      toast.error('ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط§ظ„ط­ط°ظپ')
    }
  }

  const filtered = weapons.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.nameAr && w.nameAr.includes(search)) ||
      w.weaponType.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ط§ط¨ط­ط« ط¨ط§ظ„ط§ط³ظ… ط£ظˆ ط§ظ„ظ†ظˆط¹..."
            className="w-full bg-[#040812] border border-white/10 rounded-xl pr-10 pl-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
        >
          <Plus className="w-4 h-4" />
          ط¥ط¶ط§ظپط© ط³ظ„ط§ط­ ط¬ط¯ظٹط¯
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#050913] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase font-black">
              <tr>
                <th className="py-3 px-4">ط§ظ„ط³ظ„ط§ط­</th>
                <th className="py-3 px-4">ط§ظ„ظ†ظˆط¹</th>
                <th className="py-3 px-4">ط§ظ„ظ†ط¯ط±ط©</th>
                <th className="py-3 px-4">ط§ظ„ظ‡ط¬ظˆظ… ط§ظ„ط£ط³ط§ط³ظٹ</th>
                <th className="py-3 px-4">ط§ظ„ط­ط§ظ„ط©</th>
                <th className="py-3 px-4 text-center">ط¥ط¬ط±ط§ط،ط§طھ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((w) => (
                <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                      {w.iconUrl ? (
                        <Image
                          src={w.iconUrl}
                          alt={w.name}
                          fill
                          className="object-contain p-1"
                          unoptimized
                        />
                      ) : (
                        <Shield className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-white block">{w.nameAr || w.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{w.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{w.weaponType}</td>
                  <td className="py-3 px-4 font-bold text-amber-400">{'âک…'.repeat(w.stars)}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{w.baseAtk || 'â€”'}</td>
                  <td className="py-3 px-4">
                    {w.isPublished ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Check className="w-3 h-3" /> ظ…ظ†ط´ظˆط±
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                        ظ…ط³ظˆط¯ط©
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(w)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                        title="طھط¹ط¯ظٹظ„"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(w)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="ط­ط°ظپ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-[#090e1c] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl text-right">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute left-6 top-6 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-white mb-6">
              {editingWeapon ? 'طھط¹ط¯ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط³ظ„ط§ط­' : 'ط¥ط¶ط§ظپط© ط³ظ„ط§ط­ ط¬ط¯ظٹط¯ ط¥ظ„ظ‰ ط§ظ„ظ‚ط§ط¹ط¯ط©'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">ط§ظ„ط§ط³ظ… ط¨ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#040812] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">ط§ظ„ط§ط³ظ… ط¨ط§ظ„ط¹ط±ط¨ظٹ</label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="w-full bg-[#040812] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">ط§ظ„ظ…ط¹ط±ظپ (Slug) *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-[#040812] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">ظ†ظˆط¹ ط§ظ„ط³ظ„ط§ط­</label>
                  <select
                    value={formData.weaponType}
                    onChange={(e) => setFormData({ ...formData, weaponType: e.target.value })}
                    className="w-full bg-[#040812] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {WEAPON_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">ط§ظ„ظ†ط¬ظˆظ… (ط§ظ„ظ†ط¯ط±ط©)</label>
                  <select
                    value={formData.stars}
                    onChange={(e) => setFormData({ ...formData, stars: Number(e.target.value) })}
                    className="w-full bg-[#040812] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value={5}>5 ظ†ط¬ظˆظ…</option>
                    <option value={4}>4 ظ†ط¬ظˆظ…</option>
                    <option value={3}>3 ظ†ط¬ظˆظ…</option>
                  </select>
                </div>
              </div>

              <div>
                <ImageUploadField
                  label="ط£ظٹظ‚ظˆظ†ط© ط§ظ„ط³ظ„ط§ط­ (Weapon Icon)"
                  value={formData.iconUrl || ''}
                  onChange={(url) => setFormData({ ...formData, iconUrl: url })}
                  folder="weapons"
                  type="icon"
                  placeholder="/images/weapons/weapon-name.webp"
                  helperText="ط§ط®طھط± طµظˆط±ط© ط§ظ„ط³ظ„ط§ط­ ظ…ظ† ط¬ظ‡ط§ط²ظƒ (PNG, WebP, SVG)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">ط§ظ„ظˆطµظپ ط¨ط§ظ„ط¹ط±ط¨ظٹ</label>
                <textarea
                  rows={3}
                  value={formData.descAr}
                  onChange={(e) => setFormData({ ...formData, descAr: e.target.value })}
                  className="w-full bg-[#040812] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pub"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded bg-black border-white/10 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="pub" className="text-xs font-bold text-slate-300">
                  ظ†ط´ط± ط§ظ„ط³ظ„ط§ط­ ظپظˆط±ط§ظ‹ ظپظٹ ط§ظ„ظ…ظˆظ‚ط¹
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ط¥ظ„ط؛ط§ط،
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
                >
                  {saving ? 'ط¬ط§ط±ظچ ط§ظ„ط­ظپط¸...' : 'ط­ظپط¸ ط§ظ„ط³ظ„ط§ط­'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
