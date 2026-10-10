'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Search, Filter, Eye, UploadCloud,
  CheckCircle2, Clock, AlertTriangle, RefreshCw, ChevronLeft,
  ChevronRight, ExternalLink, Archive, FileText, Loader2, Sparkles, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import ElementBadge from '@/components/ui/ElementBadge'

interface GuideItem {
  id: string
  title: string
  version: number
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'FAILED' | 'ARCHIVED'
  isActive: boolean
  pageCount: number
  createdAt: string
  publishedAt?: string | null
  character: {
    id: string
    name: string
    slug: string
    element: string
    rarity: string
    portraitPath?: string | null
  }
  pages?: Array<{ id: string; pageNumber: number; thumbnailPath?: string }>
  processingJobs?: Array<{ id: string; status: string; progress: number; errorMessage?: string }>
}

interface SimpleCharacter {
  id: string
  name: string
  slug: string
}

export default function GuidesAdminClient() {
  const [guides, setGuides] = useState<GuideItem[]>([])
  const [characters, setCharacters] = useState<SimpleCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedCharId, setSelectedCharId] = useState('')
  const [guideTitle, setGuideTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchGuides = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '15')
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/guides?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch guides')
      const data = await res.json()
      setGuides(data.guides || [])
      setTotalPages(data.pagination?.pages || 1)
      setTotalCount(data.pagination?.total || 0)
    } catch {
      toast.error('Failed to load guides')
    } finally {
      setLoading(false)
    }
  }

  const fetchCharacters = async () => {
    try {
      const res = await fetch('/api/admin/characters?limit=100')
      if (res.ok) {
        const data = await res.json()
        setCharacters(data.characters || [])
        if (data.characters?.length > 0 && !selectedCharId) {
          setSelectedCharId(data.characters[0].id)
        }
      }
    } catch {
      // non-blocking
    }
  }

  useEffect(() => {
    fetchGuides()
    fetchCharacters()
  }, [page, statusFilter])

  const handleUploadGuide = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCharId || !selectedFile || !guideTitle.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('characterId', selectedCharId)
      formData.append('title', guideTitle)
      formData.append('pdf', selectedFile)

      const res = await fetch('/api/admin/guides/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to upload guide')

      toast.success('Guide uploaded! Conversion job is running.')
      setShowUploadModal(false)
      setGuideTitle('')
      setSelectedFile(null)
      fetchGuides()
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handlePublish = async (guideId: string) => {
    try {
      const res = await fetch(`/api/admin/guides/${guideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      })
      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch {}
      if (!res.ok) throw new Error(data.error || 'Failed to publish')
      toast.success('Guide set as active and published!')
      fetchGuides()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDeleteGuide = async (guideId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete guide "${title}"?`)) {
      return
    }
    try {
      const res = await fetch(`/api/admin/guides/${guideId}`, {
        method: 'DELETE',
      })
      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch {}
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      toast.success('Guide deleted successfully')
      fetchGuides()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting guide')
    }
  }

  const handleArchive = async (guideId: string) => {
    try {
      const res = await fetch(`/api/admin/guides/${guideId}`, {
        method: 'DELETE',
      })
      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch {}
      if (!res.ok) throw new Error(data.error || 'Failed to archive')
      toast.success('Guide archived')
      fetchGuides()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-primary" />
            Build Guides Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage PDF uploads, multi-page image renders, and published build releases. ({totalCount} guides)
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-lg shadow-primary/20 shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          Upload New PDF Guide
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-xl flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
          {['ALL', 'PUBLISHED', 'READY', 'PROCESSING', 'FAILED', 'ARCHIVED'].map(status => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                statusFilter === status
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button
          onClick={fetchGuides}
          className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition"
          title="Refresh list"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Guides Grid / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-12 text-center text-gray-500 rounded-xl">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            Loading guides...
          </div>
        ) : guides.length === 0 ? (
          <div className="glass-card p-12 text-center text-gray-500 rounded-xl">
            No build guides found for this status.
          </div>
        ) : (
          guides.map(guide => (
            <div
              key={guide.id}
              className="glass-card p-5 rounded-xl border border-white/10 hover:border-white/20 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                {/* Character portrait */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/50 border border-white/10 shrink-0 flex items-center justify-center">
                  {guide.character.portraitPath ? (
                    <img
                      src={guide.character.portraitPath}
                      alt={guide.character.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-gray-500" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-base">{guide.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-mono bg-white/10 text-gray-300">
                      v{guide.version}
                    </span>
                    {guide.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-primary/20 text-primary border border-primary/40">
                        Active Public Build
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 mt-1 text-xs text-gray-400 flex-wrap">
                    <span className="font-semibold text-gray-300">{guide.character.name}</span>
                    <ElementBadge element={guide.character.element} size="sm" />
                    <span>•</span>
                    <span>{guide.pageCount} Pages</span>
                    <span>•</span>
                    <span
                      className={`font-semibold ${
                        guide.status === 'PUBLISHED' ? 'text-emerald-400' :
                        guide.status === 'READY' ? 'text-cyan-400' :
                        guide.status === 'PROCESSING' ? 'text-amber-400' :
                        guide.status === 'FAILED' ? 'text-rose-400' : 'text-gray-500'
                      }`}
                    >
                      {guide.status}
                    </span>
                  </div>

                  {/* Processing progress if currently active */}
                  {guide.status === 'PROCESSING' && guide.processingJobs?.[0] && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Converting: {guide.processingJobs[0].progress}%</span>
                    </div>
                  )}

                  {guide.status === 'FAILED' && guide.processingJobs?.[0]?.errorMessage && (
                    <div className="mt-1 text-xs text-rose-400 font-mono">
                      Error: {guide.processingJobs[0].errorMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {guide.status === 'READY' && (
                  <button
                    onClick={() => handlePublish(guide.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-semibold transition"
                  >
                    Set Active & Publish
                  </button>
                )}

                {guide.status === 'PUBLISHED' && (
                  <Link
                    href={`/characters/${guide.character.slug}`}
                    target="_blank"
                    className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/15 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Guide
                  </Link>
                )}

                {!guide.isActive && guide.status !== 'ARCHIVED' && (
                  <button
                    onClick={() => handleArchive(guide.id)}
                    className="p-2 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition"
                    title="Archive guide"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteGuide(guide.id, guide.title)}
                  className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Delete guide permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
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

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card max-w-lg w-full p-6 rounded-2xl border border-white/15 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-primary" />
                  Upload PDF Build Guide
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadGuide} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                    Target Resonator
                  </label>
                  <select
                    value={selectedCharId}
                    onChange={e => setSelectedCharId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                  >
                    {characters.map(c => (
                      <option key={c.id} value={c.id} className="bg-zinc-900">
                        {c.name} ({c.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                    Guide Title / Version Name
                  </label>
                  <input
                    type="text"
                    required
                    value={guideTitle}
                    onChange={e => setGuideTitle(e.target.value)}
                    placeholder="e.g. Endgame DPS Build & Echo Optimization"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                    PDF File Document
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    required
                    accept=".pdf,application/pdf"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Enqueue Conversion'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
