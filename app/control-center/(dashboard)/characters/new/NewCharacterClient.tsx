'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import ImageUploadField from '@/components/admin/ImageUploadField'

const ELEMENTS = [
  { value: 'AERO', label: 'Aero (Wind)' },
  { value: 'SPECTRO', label: 'Spectro (Light)' },
  { value: 'FUSION', label: 'Fusion (Fire)' },
  { value: 'ELECTRO', label: 'Electro (Lightning)' },
  { value: 'GLACIO', label: 'Glacio (Ice)' },
  { value: 'HAVOC', label: 'Havoc (Dark)' },
]

const WEAPONS = [
  { value: 'BROADBLADE', label: 'Broadblade' },
  { value: 'SWORD', label: 'Sword' },
  { value: 'PISTOLS', label: 'Pistols' },
  { value: 'GAUNTLETS', label: 'Gauntlets' },
  { value: 'RECTIFIER', label: 'Rectifier' },
]

const AVAILABLE_TAGS = ['Main DPS', 'Sub-DPS', 'Support', 'Healer', 'Buffer', 'Shield']

export default function NewCharacterClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    element: 'AERO',
    weaponType: 'SWORD',
    rarity: 'FIVE_STAR',
    description: '',
    sourceUrl: '',
    isPublished: true,
    isComingSoon: false,
    releaseVersion: '',
    isFeatured: false,
    tags: [] as string[],
    portraitPath: '',
    backgroundPath: '',
  })

  const handleNameChange = (name: string) => {
    // Generate clean slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') ? slug : prev.slug,
    }))
  }

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Character name is required')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        element: formData.element,
        weaponType: formData.weaponType,
        rarity: formData.rarity,
        description: formData.description.trim() || undefined,
        sourceUrl: formData.sourceUrl.trim() || undefined,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
        tags: formData.tags,
        portraitPath: formData.portraitPath.trim() || undefined,
        backgroundPath: formData.backgroundPath.trim() || undefined,
      }

      const res = await fetch('/api/admin/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch {}

      if (!res.ok) {
        let errorMsg = data.error || 'Failed to create character'
        if (data.details && Array.isArray(data.details)) {
          errorMsg = data.details.map((d: any) => `${d.path?.join('.') || 'field'}: ${d.message}`).join(', ')
        }
        throw new Error(errorMsg)
      }

      toast.success(`${data.character?.name || formData.name} created successfully!`)
      router.push(`/control-center/characters/${data.character.id}/edit`)
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/control-center/characters"
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Resonator</h1>
          <p className="text-sm text-gray-400">
            Set up character attributes, roles, and automated storage folders.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
          <h2 className="text-base font-semibold text-white border-b border-white/5 pb-3">
            Core Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                Character Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Jinhsi, Changli, Camellya"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                URL Slug <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. jinhsi"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:border-primary/50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for URL: /characters/{formData.slug || 'slug'} and storage directories.
              </p>
            </div>

            {/* Element */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                Element Attribute <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.element}
                onChange={e => setFormData({ ...formData, element: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
              >
                {ELEMENTS.map(el => (
                  <option key={el.value} value={el.value} className="bg-zinc-900 text-white">
                    {el.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Weapon */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                Weapon Type <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.weaponType}
                onChange={e => setFormData({ ...formData, weaponType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
              >
                {WEAPONS.map(wp => (
                  <option key={wp.value} value={wp.value} className="bg-zinc-900 text-white">
                    {wp.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rarity */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                Rarity Tier
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'FIVE_STAR', label: '5-Star Resonator', color: 'text-amber-400' },
                  { value: 'FOUR_STAR', label: '4-Star Resonator', color: 'text-purple-400' },
                ].map(r => (
                  <label
                    key={r.value}
                    className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      formData.rarity === r.value
                        ? 'border-primary/50 bg-primary/10 text-white'
                        : 'border-white/10 bg-black/20 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rarity"
                      value={r.value}
                      checked={formData.rarity === r.value}
                      onChange={e => setFormData({ ...formData, rarity: e.target.value as any })}
                      className="sr-only"
                    />
                    <span className={`text-sm font-semibold ${r.color}`}>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Source Reference URL */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                Reference Source URL (Optional)
              </label>
              <input
                type="url"
                value={formData.sourceUrl}
                onChange={e => setFormData({ ...formData, sourceUrl: e.target.value })}
                placeholder="https://www.prydwen.gg/wuthering-waves/characters/..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Character Images (Portrait & Background) */}
          <div className="pt-2 border-t border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Character Media & Artwork</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploadField
                label="Portrait Image (صورة البورتريه)"
                value={formData.portraitPath}
                onChange={(url) => setFormData({ ...formData, portraitPath: url })}
                folder="characters"
                type="portrait"
                aspectRatio="portrait"
                placeholder="/characters/slug.webp or https://..."
                helperText="Upload portrait directly from your device"
              />
              <ImageUploadField
                label="Background Banner (خلفية الشخصية)"
                value={formData.backgroundPath}
                onChange={(url) => setFormData({ ...formData, backgroundPath: url })}
                folder="characters"
                type="background"
                aspectRatio="banner"
                placeholder="/characters/slug-bg.webp or https://..."
                helperText="Upload background banner directly from your device"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
              Character Description & Combat Lore
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Overview of the character's kit, mechanics, forte circuit, and playstyle..."
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
              Role Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    formData.tags.includes(tag)
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Publishing Status & Coming Soon */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Status & Availability (حالة الشخصية)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Page Status (حالة الصفحة)
                </label>
                <select
                  value={formData.isComingSoon ? 'COMING_SOON' : formData.isPublished ? 'AVAILABLE' : 'DRAFT'}
                  onChange={e => {
                    const val = e.target.value
                    if (val === 'COMING_SOON') {
                      setFormData(prev => ({ ...prev, isComingSoon: true, isPublished: true }))
                    } else if (val === 'AVAILABLE') {
                      setFormData(prev => ({ ...prev, isComingSoon: false, isPublished: true }))
                    } else {
                      setFormData(prev => ({ ...prev, isComingSoon: false, isPublished: false }))
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50 font-semibold"
                >
                  <option value="AVAILABLE" className="bg-zinc-900 text-emerald-400">
                    🟢 متاح (Available - منشورة ومفتوحة)
                  </option>
                  <option value="COMING_SOON" className="bg-zinc-900 text-amber-400">
                    🟡 قريباً (Coming Soon - معروضة مقفلة ومظللة)
                  </option>
                  <option value="DRAFT" className="bg-zinc-900 text-gray-400">
                    ⚪ مسودة (Draft - غير منشورة للعامة)
                  </option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  شخصيات &quot;قريباً&quot; ستظهر صورتها مظللة/مموهة (Dark & Blur) مع شارة القفل.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Release Version (رقم الإصدار)
                </label>
                <input
                  type="text"
                  value={formData.releaseVersion}
                  onChange={e => setFormData(prev => ({ ...prev, releaseVersion: e.target.value }))}
                  placeholder="e.g. 3.4, 3.5..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-black/30 border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <div>
                <div className="text-sm font-semibold text-white">Feature on Homepage</div>
                <div className="text-xs text-gray-400">Spotlight in hero and featured carousels</div>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            href="/control-center/characters"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Resonator...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Continue to Media
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
