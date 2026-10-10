'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Save, UploadCloud, FileText, Image as ImageIcon,
  CheckCircle2, Clock, AlertTriangle, Trash2, ExternalLink,
  Loader2, RefreshCw, Eye, Sparkles, Check, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import ElementBadge from '@/components/ui/ElementBadge'
import WeaponBadge from '@/components/ui/WeaponBadge'
import { convertPdfToWebpPages, optimizeImageForUpload } from '@/lib/client-pdf'

const ELEMENTS = [
  { value: 'AERO', label: 'Aero' },
  { value: 'SPECTRO', label: 'Spectro' },
  { value: 'FUSION', label: 'Fusion' },
  { value: 'ELECTRO', label: 'Electro' },
  { value: 'GLACIO', label: 'Glacio' },
  { value: 'HAVOC', label: 'Havoc' },
]

const WEAPONS = [
  { value: 'BROADBLADE', label: 'Broadblade' },
  { value: 'SWORD', label: 'Sword' },
  { value: 'PISTOLS', label: 'Pistols' },
  { value: 'GAUNTLETS', label: 'Gauntlets' },
  { value: 'RECTIFIER', label: 'Rectifier' },
]

const AVAILABLE_TAGS = ['Main DPS', 'Sub-DPS', 'Support', 'Healer', 'Buffer', 'Shield']

interface GuidePage {
  id: string
  pageNumber: number
  imagePath: string
  thumbnailPath?: string
}

interface BuildGuide {
  id: string
  title: string
  version: number
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'FAILED' | 'ARCHIVED'
  isActive: boolean
  pageCount: number
  pages?: GuidePage[]
  createdAt: string
  publishedAt?: string | null
}

interface CharacterData {
  id: string
  name: string
  slug: string
  element: string
  weaponType: string
  rarity: 'FOUR_STAR' | 'FIVE_STAR'
  description?: string | null
  sourceUrl?: string | null
  portraitPath?: string | null
  backgroundPath?: string | null
  isPublished: boolean
  isFeatured: boolean
  tags: string[]
  guides?: BuildGuide[]
}

export default function EditCharacterClient({ characterId }: { characterId: string }) {
  const router = useRouter()
  const [character, setCharacter] = useState<CharacterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'guides'>('details')

  // PDF Upload state
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [pdfTitle, setPdfTitle] = useState('')
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // Image upload state
  const [uploadingPortrait, setUploadingPortrait] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const portraitInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Delete state
  const [showDeleteCharModal, setShowDeleteCharModal] = useState(false)
  const [isDeletingChar, setIsDeletingChar] = useState(false)
  const [deletingGuideId, setDeletingGuideId] = useState<string | null>(null)

  const fetchCharacter = async () => {
    try {
      const res = await fetch(`/api/admin/characters/${characterId}`)
      if (!res.ok) throw new Error('Failed to load character')
      const data = await res.json()
      const char = data.character || {}
      setCharacter({
        ...char,
        tags: Array.isArray(char.tags) ? char.tags : [],
        guides: Array.isArray(char.guides) ? char.guides : [],
      })
    } catch {
      toast.error('Failed to load character details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCharacter()
  }, [characterId])

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!character) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/characters/${character.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: character.name,
          element: character.element,
          weaponType: character.weaponType,
          rarity: character.rarity,
          description: character.description,
          sourceUrl: character.sourceUrl,
          isPublished: character.isPublished,
          isFeatured: character.isFeatured,
          tags: character.tags,
        }),
      })

      if (!res.ok) throw new Error('Failed to update character')
      toast.success('Character details updated!')
    } catch (err: any) {
      toast.error(err.message || 'Error updating character')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (type: 'portrait' | 'background', file: File) => {
    if (!character) return
    const isPortrait = type === 'portrait'
    if (isPortrait) setUploadingPortrait(true)
    else setUploadingBanner(true)

    try {
      // Optimize image in browser before uploading to avoid upload limits and speed up transfers
      const fileToUpload = await optimizeImageForUpload(file, isPortrait ? 800 : 1920, 0.88)

      const formData = new FormData()
      formData.append('characterId', character.id)
      formData.append('type', type)
      formData.append('file', fileToUpload)

      const res = await fetch('/api/admin/upload/image', {
        method: 'POST',
        body: formData,
      })

      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch {}
      if (!res.ok) throw new Error(data.error || 'Failed to upload image')

      toast.success(`${type === 'portrait' ? 'Portrait' : 'Banner'} uploaded successfully!`)
      setCharacter(prev =>
        prev
          ? {
              ...prev,
              [type === 'portrait' ? 'portraitPath' : 'backgroundPath']: data.path,
            }
          : null
      )
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      if (isPortrait) setUploadingPortrait(false)
      else setUploadingBanner(false)
    }
  }

  const handlePdfUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!character || !selectedPdfFile) return
    if (!pdfTitle.trim()) {
      toast.error('Please enter a guide title')
      return
    }

    setUploadingPdf(true)
    try {
      let pages: string[]

      if (selectedPdfFile.type === 'application/pdf' || selectedPdfFile.name.toLowerCase().endsWith('.pdf')) {
        // Convert PDF pages to WebP images in the browser (avoids Netlify 413)
        toast.loading(`Converting PDF\u2026 (this may take a moment)`, { id: 'pdf-convert' })
        pages = await convertPdfToWebpPages(selectedPdfFile, (current, total) => {
          toast.loading(`Converting page ${current} of ${total}\u2026`, { id: 'pdf-convert' })
        })
        toast.dismiss('pdf-convert')
      } else {
        // File is already an image; wrap in array
        const reader = new FileReader()
        pages = await new Promise<string[]>((resolve, reject) => {
          reader.onload = () => resolve([reader.result as string])
          reader.onerror = reject
          reader.readAsDataURL(selectedPdfFile)
        })
      }

      if (pages.length === 0) {
        throw new Error('No pages could be extracted from the file.')
      }

      const res = await fetch('/api/admin/guides/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          title: pdfTitle,
          pages,
        }),
      })

      const text = await res.text()
      let data: any = {}
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`Upload server error (${res.status}): ${text.slice(0, 80) || 'Invalid server response'}`)
      }
      if (!res.ok) throw new Error(data.error || 'Failed to upload guide')

      toast.success(`Guide uploaded successfully! (${pages.length} page${pages.length !== 1 ? 's' : ''})`)
      setPdfTitle('')
      setSelectedPdfFile(null)
      if (pdfInputRef.current) pdfInputRef.current.value = ''
      fetchCharacter()
    } catch (err: any) {
      toast.dismiss('pdf-convert')
      toast.error(err.message || 'PDF upload failed')
    } finally {
      setUploadingPdf(false)
    }
  }

  const handlePublishGuide = async (guideId: string) => {
    try {
      const res = await fetch(`/api/admin/guides/${guideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      })
      const text = await res.text()
      let err: any = {}
      try { err = JSON.parse(text) } catch {}
      if (!res.ok) {
        throw new Error(err.error || 'Failed to publish guide')
      }
      toast.success('Guide set as active and published!')
      fetchCharacter()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDeleteGuide = async (guideId: string, guideTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete guide "${guideTitle}"? This cannot be undone.`)) {
      return
    }

    setDeletingGuideId(guideId)
    try {
      const res = await fetch(`/api/admin/guides/${guideId}`, {
        method: 'DELETE',
      })
      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch {}
      if (!res.ok) throw new Error(data.error || 'Failed to delete guide')

      toast.success('Guide deleted successfully')
      fetchCharacter()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting guide')
    } finally {
      setDeletingGuideId(null)
    }
  }

  const handleDeleteCharacter = async () => {
    if (!character) return
    setIsDeletingChar(true)
    try {
      const res = await fetch(`/api/admin/characters/${character.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch {}
      if (!res.ok) throw new Error(data.error || 'Failed to delete character')

      toast.success(`Deleted ${character.name}`)
      router.push('/control-center/characters')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete character')
      setIsDeletingChar(false)
    }
  }

  const toggleTag = (tag: string) => {
    if (!character) return
    const currentTags = Array.isArray(character.tags) ? character.tags : []
    setCharacter({
      ...character,
      tags: currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag],
    })
  }

  if (loading || !character) {
    return (
      <div className="py-24 text-center text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
        Loading resonator configuration...
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link
            href="/control-center/characters"
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <span>{character.name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-white/10 text-gray-300">
                /{character.slug}
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <ElementBadge element={character.element} size="sm" />
              <WeaponBadge weapon={character.weaponType} size="sm" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/characters/${character.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs font-semibold transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Public Page
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteCharModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:text-white hover:bg-rose-500/20 text-xs font-semibold transition"
            title="Delete resonator"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-white/10 gap-2">
        {[
          { key: 'details', label: 'Resonator Profile', icon: Sparkles },
          { key: 'media', label: 'Portraits & Art', icon: ImageIcon },
          { key: 'guides', label: `Build Guides (${character.guides?.length || 0})`, icon: FileText },
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition -mb-px ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* TAB 1: Profile Details */}
      {activeTab === 'details' && (
        <form onSubmit={handleSaveDetails} className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Resonator Name
                </label>
                <input
                  type="text"
                  required
                  value={character.name}
                  onChange={e => setCharacter({ ...character, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Element
                </label>
                <select
                  value={character.element}
                  onChange={e => setCharacter({ ...character, element: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                >
                  {ELEMENTS.map(el => (
                    <option key={el.value} value={el.value} className="bg-zinc-900">
                      {el.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Weapon Type
                </label>
                <select
                  value={character.weaponType}
                  onChange={e => setCharacter({ ...character, weaponType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                >
                  {WEAPONS.map(wp => (
                    <option key={wp.value} value={wp.value} className="bg-zinc-900">
                      {wp.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Rarity
                </label>
                <select
                  value={character.rarity}
                  onChange={e => setCharacter({ ...character, rarity: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                >
                  <option value="FIVE_STAR" className="bg-zinc-900">5-Star</option>
                  <option value="FOUR_STAR" className="bg-zinc-900">4-Star</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Reference Source Link
                </label>
                <input
                  type="url"
                  value={character.sourceUrl || ''}
                  onChange={e => setCharacter({ ...character, sourceUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Combat Lore & Playstyle Guide
                </label>
                <textarea
                  rows={4}
                  value={character.description || ''}
                  onChange={e => setCharacter({ ...character, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                Combat Roles
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      (character.tags || []).includes(tag)
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Status switches */}
            <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-black/30 border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={character.isPublished}
                  onChange={e => setCharacter({ ...character, isPublished: e.target.checked })}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <div>
                  <div className="text-sm font-semibold text-white">Public Status</div>
                  <div className="text-xs text-gray-400">Live on public resonator roster</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-black/30 border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={character.isFeatured}
                  onChange={e => setCharacter({ ...character, isFeatured: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <div>
                  <div className="text-sm font-semibold text-white">Featured Resonator</div>
                  <div className="text-xs text-gray-400">Spotlighted on homepage hero and top picks</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Media Management */}
      {activeTab === 'media' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portrait Image */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Resonator Portrait</h3>
                <p className="text-xs text-gray-400">Card thumbnails and list portraits (PNG/WebP/JPG)</p>
              </div>
            </div>

            <div className="w-full aspect-[3/4] max-h-80 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center relative group">
              {character.portraitPath ? (
                <img
                  src={character.portraitPath}
                  alt={character.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="text-center p-6 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No portrait image uploaded yet</p>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={portraitInputRef}
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleImageUpload('portrait', f)
                e.target.value = ''
              }}
            />

            <button
              type="button"
              disabled={uploadingPortrait}
              onClick={() => portraitInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {uploadingPortrait ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Optimizing & Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-primary" />
                  Upload New Portrait
                </>
              )}
            </button>
          </div>

          {/* Banner / Background Image */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Backdrop / Splash Art</h3>
                <p className="text-xs text-gray-400">Cinematic detail page banner (16:9 recommended)</p>
              </div>
            </div>

            <div className="w-full aspect-video max-h-80 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center relative group">
              {character.backgroundPath ? (
                <img
                  src={character.backgroundPath}
                  alt={`${character.name} backdrop`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No backdrop art uploaded yet</p>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={bannerInputRef}
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleImageUpload('background', f)
                e.target.value = ''
              }}
            />

            <button
              type="button"
              disabled={uploadingBanner}
              onClick={() => bannerInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {uploadingBanner ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Optimizing & Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-primary" />
                  Upload Backdrop Art
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Build Guides */}
      {activeTab === 'guides' && (
        <div className="space-y-6">
          {/* Upload New PDF Guide Form */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" />
                Upload PDF Build Guide
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Upload a multi-page PDF guide. The system will automatically convert each page to high-res WebP images and generate crisp thumbnails.
              </p>
            </div>

            <form onSubmit={handlePdfUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Guide Title / Version Label
                  </label>
                  <input
                    type="text"
                    required
                    value={pdfTitle}
                    onChange={e => setPdfTitle(e.target.value)}
                    placeholder="e.g. Complete Endgame DPS Build Guide v2.0"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Select PDF Document
                  </label>
                  <input
                    type="file"
                    ref={pdfInputRef}
                    required
                    accept=".pdf,application/pdf"
                    onChange={e => setSelectedPdfFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploadingPdf || !selectedPdfFile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  {uploadingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading & Enqueuing...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Start Conversion Job
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Guides List */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Existing Build Guides</h3>
              <button
                onClick={fetchCharacter}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
                title="Refresh guides"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {!character.guides || character.guides.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  No build guides uploaded for {character.name} yet.
                </div>
              ) : (
                character.guides.map(guide => (
                  <div key={guide.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-white text-base">{guide.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded font-mono bg-white/10 text-gray-300">
                          v{guide.version}
                        </span>
                        {guide.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-primary/20 text-primary border border-primary/40">
                            Active Public Build
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{guide.pageCount} pages rendered</span>
                        <span>•</span>
                        <span className={`font-medium ${
                          guide.status === 'PUBLISHED' ? 'text-emerald-400' :
                          guide.status === 'READY' ? 'text-cyan-400' :
                          guide.status === 'PROCESSING' ? 'text-amber-400' :
                          guide.status === 'FAILED' ? 'text-rose-400' : 'text-gray-400'
                        }`}>
                          Status: {guide.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {guide.status === 'READY' && (
                        <button
                          type="button"
                          onClick={() => handlePublishGuide(guide.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-semibold transition"
                        >
                          Set Active & Publish
                        </button>
                      )}

                      {guide.status === 'PUBLISHED' && (
                        <Link
                          href={`/characters/${character.slug}`}
                          target="_blank"
                          className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/15 text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View in Public Reader
                        </Link>
                      )}

                      <button
                        type="button"
                        disabled={deletingGuideId === guide.id}
                        onClick={() => handleDeleteGuide(guide.id, guide.title)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-white text-xs font-semibold transition flex items-center gap-1 disabled:opacity-40"
                        title="Delete this build guide"
                      >
                        {deletingGuideId === guide.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Resonator Confirmation Modal */}
      <AnimatePresence>
        {showDeleteCharModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card max-w-md w-full p-6 rounded-2xl border border-rose-500/30 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold text-white">Delete Resonator</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">{character.name}</strong>?
                This action is permanent. All associated build guides, rendered pages, and image assets will be purged.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteCharModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingChar}
                  onClick={handleDeleteCharacter}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-xs font-semibold transition flex items-center gap-2"
                >
                  {isDeletingChar ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Permanently Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
