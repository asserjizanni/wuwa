'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Search, Filter, Trash2, Edit3, Eye,
  BookOpen, Star, Sparkles, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, ChevronLeft, ChevronRight,
  ExternalLink, Lock
} from 'lucide-react'
import toast from 'react-hot-toast'
import ElementBadge from '@/components/ui/ElementBadge'
import WeaponBadge from '@/components/ui/WeaponBadge'

interface Character {
  id: string
  name: string
  slug: string
  element: string
  weaponType: string
  rarity: 'FOUR_STAR' | 'FIVE_STAR'
  isPublished: boolean
  isComingSoon?: boolean
  releaseVersion?: string | null
  isFeatured: boolean
  portraitPath?: string | null
  _count?: { guides: number }
  guides?: Array<{ id: string; status: string; isActive: boolean }>
  createdAt: string
}

const ELEMENTS = ['ALL', 'AERO', 'SPECTRO', 'FUSION', 'ELECTRO', 'GLACIO', 'HAVOC']

export default function CharactersAdminClient() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedElement, setSelectedElement] = useState('ALL')
  const [publishedFilter, setPublishedFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Delete modal state
  const [deletingChar, setDeletingChar] = useState<Character | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCharacters = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '15')
      if (search) params.set('search', search)
      if (selectedElement !== 'ALL') params.set('element', selectedElement)
      if (publishedFilter === 'COMING_SOON') params.set('status', 'COMING_SOON')
      if (publishedFilter === 'PUBLISHED') params.set('status', 'AVAILABLE')
      if (publishedFilter === 'DRAFT') params.set('status', 'DRAFT')

      const res = await fetch(`/api/admin/characters?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch characters')
      const data = await res.json()
      setCharacters(data.characters || [])
      setTotalPages(data.pagination?.pages || 1)
      setTotalCount(data.pagination?.total || 0)
    } catch (err) {
      toast.error('Failed to load characters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCharacters()
  }, [page, selectedElement, publishedFilter])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchCharacters()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const togglePublished = async (char: Character) => {
    const isCurrentlyAvailable = char.isPublished && !char.isComingSoon
    const nextPublished = !isCurrentlyAvailable
    const nextComingSoon = isCurrentlyAvailable

    try {
      const res = await fetch(`/api/admin/characters/${char.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: nextPublished,
          isComingSoon: nextComingSoon,
        }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setCharacters(prev =>
        prev.map(c =>
          c.id === char.id
            ? {
                ...c,
                isPublished: updated.character.isPublished,
                isComingSoon: updated.character.isComingSoon,
              }
            : c
        )
      )
      toast.success(
        nextPublished
          ? `تم نشر ${char.name} وأصبحت متاحة للجميع!`
          : `تم تحويل ${char.name} إلى حالة (قريباً - مقفل)`
      )
    } catch {
      toast.error('فشل تحديث حالة الشخصية')
    }
  }

  const toggleFeatured = async (char: Character) => {
    try {
      const res = await fetch(`/api/admin/characters/${char.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !char.isFeatured }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setCharacters(prev =>
        prev.map(c => (c.id === char.id ? { ...c, isFeatured: updated.character.isFeatured } : c))
      )
      toast.success(
        updated.character.isFeatured ? `${char.name} set as featured` : `${char.name} unfeatured`
      )
    } catch {
      toast.error('Could not update featured flag')
    }
  }

  const handleDelete = async () => {
    if (!deletingChar) return
    const input = deleteConfirmText.trim().toLowerCase()
    const nameMatch = input === deletingChar.name.trim().toLowerCase()
    const slugMatch = input === deletingChar.slug.trim().toLowerCase()
    if (!nameMatch && !slugMatch) {
      toast.error('Character name does not match')
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/characters/${deletingChar.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch {}
      if (!res.ok) throw new Error(data.error || 'Failed to delete')

      toast.success(`Deleted ${deletingChar.name}`)
      setDeletingChar(null)
      setDeleteConfirmText('')
      fetchCharacters()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete character')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-primary" />
            Character Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage Wuthering Waves Resonators, guide assets, and publication status. ({totalCount} total)
          </p>
        </div>

        <Link
          href="/control-center/characters/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-lg shadow-primary/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Character
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by character name or slug..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0 bg-black/40 p-1 rounded-lg border border-white/10 overflow-x-auto">
            {[
              { id: 'ALL', label: 'الكل (All)' },
              { id: 'PUBLISHED', label: '🟢 متاح (Available)' },
              { id: 'COMING_SOON', label: '🟡 قريباً (Coming Soon)' },
              { id: 'DRAFT', label: '⚪ مسودة (Draft)' },
            ].map(status => (
              <button
                key={status.id}
                onClick={() => {
                  setPublishedFilter(status.id)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  publishedFilter === status.id
                    ? status.id === 'COMING_SOON'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : status.id === 'PUBLISHED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Element Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-gray-500 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Element:
          </span>
          {ELEMENTS.map(elem => (
            <button
              key={elem}
              onClick={() => {
                setSelectedElement(elem)
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-lg transition shrink-0 font-medium ${
                selectedElement === elem
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-gray-400 hover:text-white bg-white/5'
              }`}
            >
              {elem}
            </button>
          ))}
        </div>
      </div>

      {/* Characters Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm text-gray-300">
            <thead className="bg-white/[0.03] text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Character</th>
                <th className="py-3 px-4">Element / Weapon</th>
                <th className="py-3 px-4">Rarity</th>
                <th className="py-3 px-4">Guides</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Featured</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary/60" />
                    Loading resonators...
                  </td>
                </tr>
              ) : characters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No characters found matching your filters.
                  </td>
                </tr>
              ) : (
                characters.map(char => (
                  <tr key={char.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`relative w-11 h-11 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border ${
                          char.isComingSoon
                            ? 'bg-amber-950/40 border-amber-500/40'
                            : 'bg-black/50 border-white/10'
                        }`}>
                          {char.portraitPath ? (
                            <img
                              src={char.portraitPath}
                              alt={char.name}
                              className={`w-full h-full object-cover object-top transition ${
                                char.isComingSoon ? 'blur-[1.5px] brightness-50 contrast-125' : ''
                              }`}
                            />
                          ) : (
                            <Users className="w-5 h-5 text-gray-500" />
                          )}
                          {char.isComingSoon && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                              <Lock className="w-4 h-4 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/control-center/characters/${char.id}/edit`}
                              className="font-semibold text-white hover:text-primary transition"
                            >
                              {char.name}
                            </Link>
                            {char.isComingSoon && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                قريباً
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">/{char.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ElementBadge element={char.element} size="sm" />
                        <WeaponBadge weapon={char.weaponType} size="sm" />
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-semibold ${
                          char.rarity === 'FIVE_STAR'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        <Star className="w-3 h-3 fill-current" />
                        {char.rarity === 'FIVE_STAR' ? '5-Star' : '4-Star'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        <span>{char._count?.guides || 0} builds</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {char.isPublished && !char.isComingSoon ? (
                        <button
                          onClick={() => togglePublished(char)}
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition shadow-sm"
                          title="متاح ومنشور للجمهور - انقر للتحويل إلى قريباً ومقفل"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>متاح (منشور)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => togglePublished(char)}
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition shadow-sm"
                          title="قريباً ومقفل - انقر لنشر الدليل وجعله متاحاً للجميع"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>قريباً (مقفل)</span>
                          {char.releaseVersion && (
                            <span className="text-[10px] px-1 bg-amber-500/20 rounded font-mono">
                              {char.releaseVersion}
                            </span>
                          )}
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleFeatured(char)}
                        className={`p-1.5 rounded-lg transition ${
                          char.isFeatured
                            ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                            : 'text-gray-600 hover:text-gray-400'
                        }`}
                        title={char.isFeatured ? 'Featured on home' : 'Set as featured'}
                      >
                        <Sparkles className="w-4 h-4 fill-current" />
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/characters/${char.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
                          title="View public page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/control-center/characters/${char.id}/edit`}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition"
                          title="Edit character"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeletingChar(char)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-400/10 transition"
                          title="Delete character"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-sm text-gray-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingChar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card max-w-md w-full p-6 rounded-2xl border border-rose-500/30 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold text-white">Delete Resonator</h3>
              </div>
              <p className="text-sm text-gray-300">
                Are you sure you want to delete{' '}
                <strong className="text-white">{deletingChar.name}</strong>? This will permanently
                remove all associated build guides, converted images, and processing records.
              </p>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-400">
                    Type <span className="font-mono text-white font-bold">{deletingChar.name}</span> to confirm:
                  </label>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmText(deletingChar.name)}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    Auto-fill
                  </button>
                </div>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder={deletingChar.name}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500/50 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingChar(null)
                    setDeleteConfirmText('')
                  }}
                  className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    (deleteConfirmText.trim().toLowerCase() !== deletingChar.name.trim().toLowerCase() &&
                     deleteConfirmText.trim().toLowerCase() !== deletingChar.slug.trim().toLowerCase()) ||
                    isDeleting
                  }
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-500 disabled:opacity-40 transition"
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
