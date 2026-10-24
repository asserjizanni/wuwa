'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Plus, Search, Edit2, Trash2, Sparkles, Check, X,
  Layers, Disc, ChevronLeft, ChevronRight, Eye, EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'
import ImageUploadField from '@/components/admin/ImageUploadField'

interface Echo {
  id: string
  slug: string
  name: string
  nameAr: string | null
  echoClass: string | null
  cost: number
  iconUrl: string | null
  cooldown: number | null
  description: string | null
  descriptionAr: string | null
  sonataSets: string[]
  isPublished: boolean
}

interface SonataSet {
  id: string
  slug: string
  name: string
  nameAr: string | null
  iconUrl: string | null
  twoPieceEffect: string | null
  twoPieceEffectAr: string | null
  fivePieceEffect: string | null
  fivePieceEffectAr: string | null
}

export default function EchoesAdminClient({
  initialEchoes,
  initialSonataSets,
}: {
  initialEchoes: Echo[]
  initialSonataSets: SonataSet[]
}) {
  const [activeTab, setActiveTab] = useState<'echoes' | 'sets'>('echoes')
  const [echoes, setEchoes] = useState<Echo[]>(initialEchoes)
  const [sonataSets, setSonataSets] = useState<SonataSet[]>(initialSonataSets)

  // Filters & search
  const [search, setSearch] = useState('')
  const [selectedCost, setSelectedCost] = useState<number | null>(null)
  const [selectedClass, setSelectedClass] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 24

  // Modal states
  const [echoModalOpen, setEchoModalOpen] = useState(false)
  const [editingEcho, setEditingEcho] = useState<Echo | null>(null)
  const [savingEcho, setSavingEcho] = useState(false)

  const [setModalOpen, setSetModalOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<SonataSet | null>(null)
  const [savingSet, setSavingSet] = useState(false)

  // Echo Form state
  const [echoForm, setEchoForm] = useState({
    name: '',
    nameAr: '',
    slug: '',
    echoClass: 'Common',
    cost: 1,
    iconUrl: '',
    cooldown: 0,
    description: '',
    descriptionAr: '',
    sonataSets: [] as string[],
    isPublished: true,
  })

  // Sonata Set Form state
  const [setForm, setSetForm] = useState({
    name: '',
    nameAr: '',
    slug: '',
    iconUrl: '',
    twoPieceEffect: '',
    twoPieceEffectAr: '',
    fivePieceEffect: '',
    fivePieceEffectAr: '',
  })

  // Open Echo modal
  const openCreateEcho = () => {
    setEditingEcho(null)
    setEchoForm({
      name: '',
      nameAr: '',
      slug: '',
      echoClass: 'Common',
      cost: 1,
      iconUrl: '',
      cooldown: 0,
      description: '',
      descriptionAr: '',
      sonataSets: [],
      isPublished: true,
    })
    setEchoModalOpen(true)
  }

  const openEditEcho = (ec: Echo) => {
    setEditingEcho(ec)
    setEchoForm({
      name: ec.name,
      nameAr: ec.nameAr || '',
      slug: ec.slug,
      echoClass: ec.echoClass || 'Common',
      cost: ec.cost,
      iconUrl: ec.iconUrl || '',
      cooldown: ec.cooldown || 0,
      description: ec.description || '',
      descriptionAr: ec.descriptionAr || '',
      sonataSets: Array.isArray(ec.sonataSets) ? ec.sonataSets : [],
      isPublished: ec.isPublished,
    })
    setEchoModalOpen(true)
  }

  const handleSaveEcho = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEcho(true)

    try {
      const res = await fetch('/api/admin/echoes', {
        method: editingEcho ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...echoForm,
          id: editingEcho?.id,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'فشلت العملية')
      }

      const saved = await res.json()
      if (editingEcho) {
        setEchoes(prev => prev.map(item => item.id === saved.id ? saved : item))
        toast.success('تم تحديث الإيكو بنجاح')
      } else {
        setEchoes(prev => [saved, ...prev])
        toast.success('تمت إضافة الإيكو بنجاح')
      }
      setEchoModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setSavingEcho(false)
    }
  }

  const handleDeleteEcho = async (ec: Echo) => {
    if (!confirm(`هل أنت متأكد من حذف الإيكو "${ec.nameAr || ec.name}"؟`)) return

    try {
      const res = await fetch(`/api/admin/echoes?id=${ec.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('فشل الحذف')

      setEchoes(prev => prev.filter(item => item.id !== ec.id))
      toast.success('تم حذف الإيكو بنجاح')
    } catch {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  // Open Set modal
  const openCreateSet = () => {
    setEditingSet(null)
    setSetForm({
      name: '',
      nameAr: '',
      slug: '',
      iconUrl: '',
      twoPieceEffect: '',
      twoPieceEffectAr: '',
      fivePieceEffect: '',
      fivePieceEffectAr: '',
    })
    setSetModalOpen(true)
  }

  const openEditSet = (s: SonataSet) => {
    setEditingSet(s)
    setSetForm({
      name: s.name,
      nameAr: s.nameAr || '',
      slug: s.slug,
      iconUrl: s.iconUrl || '',
      twoPieceEffect: s.twoPieceEffect || '',
      twoPieceEffectAr: s.twoPieceEffectAr || '',
      fivePieceEffect: s.fivePieceEffect || '',
      fivePieceEffectAr: s.fivePieceEffectAr || '',
    })
    setSetModalOpen(true)
  }

  const handleSaveSet = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSet(true)

    try {
      const res = await fetch('/api/admin/sonata-sets', {
        method: editingSet ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...setForm,
          id: editingSet?.id,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'فشلت العملية')
      }

      const saved = await res.json()
      if (editingSet) {
        setSonataSets(prev => prev.map(item => item.id === saved.id ? saved : item))
        toast.success('تم تحديث طقم السوناتا بنجاح')
      } else {
        setSonataSets(prev => [saved, ...prev])
        toast.success('تمت إضافة طقم السوناتا بنجاح')
      }
      setSetModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setSavingSet(false)
    }
  }

  const handleDeleteSet = async (s: SonataSet) => {
    if (!confirm(`هل أنت متأكد من حذف طقم السوناتا "${s.nameAr || s.name}"؟`)) return

    try {
      const res = await fetch(`/api/admin/sonata-sets?id=${s.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('فشل الحذف')

      setSonataSets(prev => prev.filter(item => item.id !== s.id))
      toast.success('تم حذف طقم السوناتا بنجاح')
    } catch {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  // Filter echoes
  const filteredEchoes = echoes.filter(ec => {
    const matchesSearch =
      ec.name.toLowerCase().includes(search.toLowerCase()) ||
      (ec.nameAr && ec.nameAr.includes(search)) ||
      ec.slug.toLowerCase().includes(search.toLowerCase())
    const matchesCost = selectedCost === null || ec.cost === selectedCost
    const matchesClass = selectedClass === 'ALL' || ec.echoClass === selectedClass
    return matchesSearch && matchesCost && matchesClass
  })

  // Pagination for echoes
  const totalPages = Math.ceil(filteredEchoes.length / PAGE_SIZE) || 1
  const paginatedEchoes = filteredEchoes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  // Filter sonata sets
  const filteredSets = sonataSets.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.nameAr && s.nameAr.includes(search)) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSetInEcho = (setSlug: string) => {
    setEchoForm(prev => {
      const exists = prev.sonataSets.includes(setSlug)
      if (exists) {
        return { ...prev, sonataSets: prev.sonataSets.filter(s => s !== setSlug) }
      } else {
        return { ...prev, sonataSets: [...prev.sonataSets, setSlug] }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Tab Switcher */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-wrap gap-4">
        <div className="flex items-center gap-3 bg-[#0a101f] p-1.5 rounded-2xl border border-white/[0.08]">
          <button
            onClick={() => { setActiveTab('echoes'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'echoes'
                ? 'bg-gradient-to-r from-[#00c8ff] to-[#0077cc] text-[#040814] shadow-[0_0_20px_rgba(0,200,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={16} />
            <span>الإيكو (Echoes)</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-black/20">
              {echoes.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('sets'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'sets'
                ? 'bg-gradient-to-r from-[#00c8ff] to-[#0077cc] text-[#040814] shadow-[0_0_20px_rgba(0,200,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={16} />
            <span>أطقم السوناتا (Sonata Sets)</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-black/20">
              {sonataSets.length}
            </span>
          </button>
        </div>

        {activeTab === 'echoes' ? (
          <button
            onClick={openCreateEcho}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00c8ff] hover:bg-[#38bdf8] text-[#040814] font-black text-sm transition-all shadow-[0_0_15px_rgba(0,200,255,0.25)]"
          >
            <Plus size={18} />
            <span>إضافة إيكو جديد</span>
          </button>
        ) : (
          <button
            onClick={openCreateSet}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00c8ff] hover:bg-[#38bdf8] text-[#040814] font-black text-sm transition-all shadow-[0_0_15px_rgba(0,200,255,0.25)]"
          >
            <Plus size={18} />
            <span>إضافة طقم سوناتا</span>
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'echoes' ? 'ابحث بالاسم العربي أو الإنجليزي للإيكو...' : 'ابحث عن طقم سوناتا...'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[#070c18] border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00c8ff]/50 transition-colors"
          />
        </div>

        {activeTab === 'echoes' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-bold ml-1">الكوست:</span>
            {[null, 4, 3, 1].map((costVal) => (
              <button
                key={String(costVal)}
                onClick={() => { setSelectedCost(costVal); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCost === costVal
                    ? 'bg-[#00c8ff] text-[#040814] shadow-[0_0_10px_rgba(0,200,255,0.3)]'
                    : 'bg-white/[0.05] border border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {costVal === null ? 'الكل' : `Cost ${costVal}`}
              </button>
            ))}

            <span className="text-xs text-slate-400 font-bold ml-1 mr-3">الفئة:</span>
            {['ALL', 'Calamity', 'Overlord', 'Elite', 'Common'].map((cVal) => (
              <button
                key={cVal}
                onClick={() => { setSelectedClass(cVal); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedClass === cVal
                    ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'bg-white/[0.05] border border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {cVal === 'ALL' ? 'الكل' : cVal}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ECHOES TAB CONTENT
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'echoes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedEchoes.map((ec) => {
              const costBadgeColor =
                ec.cost === 4
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : ec.cost === 3
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'

              return (
                <div
                  key={ec.id}
                  className="bg-[#070c18] border border-white/[0.08] hover:border-[#00c8ff]/40 rounded-2xl p-4 flex flex-col justify-between transition-all group hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
                >
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 overflow-hidden relative shrink-0 flex items-center justify-center">
                        {ec.iconUrl ? (
                          <Image
                            src={ec.iconUrl}
                            alt={ec.name}
                            fill
                            className="object-contain p-1"
                            onError={(e) => {
                              // If image fails, fallback gracefully
                              (e.target as any).style.display = 'none'
                            }}
                          />
                        ) : (
                          <Disc className="w-6 h-6 text-slate-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${costBadgeColor}`}>
                            Cost {ec.cost}
                          </span>
                          {ec.echoClass && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/[0.05] text-slate-300 border border-white/10">
                              {ec.echoClass}
                            </span>
                          )}
                          {!ec.isPublished && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              مسودة
                            </span>
                          )}
                        </div>

                        <h3 className="text-white font-bold text-sm truncate leading-snug">
                          {ec.nameAr || ec.name}
                        </h3>
                        <p className="text-slate-400 text-xs truncate font-mono mt-0.5">
                          {ec.name}
                        </p>
                      </div>
                    </div>

                    {/* Sonata Sets badges */}
                    {ec.sonataSets && ec.sonataSets.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        {ec.sonataSets.map((sSlug) => {
                          const matchedSet = sonataSets.find(s => s.slug === sSlug)
                          return (
                            <span
                              key={sSlug}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.07] text-[10px] text-slate-300 font-medium"
                            >
                              {matchedSet?.iconUrl && (
                                <Image
                                  src={matchedSet.iconUrl}
                                  alt={sSlug}
                                  width={12}
                                  height={12}
                                  className="object-contain"
                                />
                              )}
                              <span>{matchedSet?.nameAr || matchedSet?.name || sSlug}</span>
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {ec.descriptionAr && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {ec.descriptionAr}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-auto">
                    <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                      {ec.slug}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditEcho(ec)}
                        className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-[#00c8ff]/20 text-slate-300 hover:text-[#00c8ff] transition-colors"
                        title="تعديل"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteEcho(ec)}
                        className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-[#070c18] border border-white/[0.08] px-4 py-3 rounded-2xl">
              <p className="text-xs text-slate-400">
                عرض {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, filteredEchoes.length)} من أصل {filteredEchoes.length} إيكو
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                >
                  <ChevronRight size={16} />
                </button>
                <span className="text-xs font-bold text-white px-3 py-1 bg-white/[0.04] rounded-lg border border-white/10">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SONATA SETS TAB CONTENT
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'sets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSets.map((s) => (
            <div
              key={s.id}
              className="bg-[#070c18] border border-white/[0.08] hover:border-[#00c8ff]/40 rounded-2xl p-5 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 overflow-hidden relative shrink-0 flex items-center justify-center">
                      {s.iconUrl ? (
                        <Image
                          src={s.iconUrl}
                          alt={s.name}
                          fill
                          className="object-contain p-1.5"
                        />
                      ) : (
                        <Layers className="w-6 h-6 text-[#00c8ff]" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-black text-base">
                        {s.nameAr || s.name}
                      </h3>
                      <p className="text-slate-400 text-xs font-mono">{s.name} ({s.slug})</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditSet(s)}
                      className="p-2 rounded-xl bg-white/[0.05] hover:bg-[#00c8ff]/20 text-slate-300 hover:text-[#00c8ff] transition-colors"
                      title="تعديل"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSet(s)}
                      className="p-2 rounded-xl bg-white/[0.05] hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 mb-1">
                      تأثير القطعتين (2-Piece)
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {s.twoPieceEffectAr || s.twoPieceEffect || 'لا يوجد وصف متاح'}
                    </p>
                  </div>

                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30 mb-1">
                      تأثير الـ 5 قطع (5-Piece)
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {s.fivePieceEffectAr || s.fivePieceEffect || 'لا يوجد وصف متاح'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CREATE / EDIT ECHO
          ───────────────────────────────────────────────────────────── */}
      {echoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#090e1c] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00c8ff]" />
                <span>{editingEcho ? 'تعديل الإيكو' : 'إضافة إيكو جديد'}</span>
              </h2>
              <button
                onClick={() => setEchoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEcho} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الاسم بالإنجليزية *
                  </label>
                  <input
                    type="text"
                    required
                    value={echoForm.name}
                    onChange={(e) => setEchoForm({ ...echoForm, name: e.target.value })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الاسم بالعربية
                  </label>
                  <input
                    type="text"
                    value={echoForm.nameAr}
                    onChange={(e) => setEchoForm({ ...echoForm, nameAr: e.target.value })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    المعرف (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    value={echoForm.slug}
                    onChange={(e) => setEchoForm({ ...echoForm, slug: e.target.value })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الكوست (Cost)
                  </label>
                  <select
                    value={echoForm.cost}
                    onChange={(e) => setEchoForm({ ...echoForm, cost: Number(e.target.value) })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60"
                  >
                    <option value={1}>Cost 1</option>
                    <option value={3}>Cost 3</option>
                    <option value={4}>Cost 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الفئة (Echo Class)
                  </label>
                  <select
                    value={echoForm.echoClass}
                    onChange={(e) => setEchoForm({ ...echoForm, echoClass: e.target.value })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60"
                  >
                    <option value="Common">Common</option>
                    <option value="Elite">Elite</option>
                    <option value="Overlord">Overlord</option>
                    <option value="Calamity">Calamity</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <ImageUploadField
                  label="أيقونة الإيكو (Echo Icon)"
                  value={echoForm.iconUrl || ''}
                  onChange={(url) => setEchoForm({ ...echoForm, iconUrl: url })}
                  folder="echoes"
                  type="icon"
                  placeholder="/images/echoes/slug.webp"
                  helperText="اختر صورة الإيكو من جهازك (PNG, WebP, SVG)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    مدة التهدئة بالثواني (Cooldown)
                  </label>
                  <input
                    type="number"
                    value={echoForm.cooldown}
                    onChange={(e) => setEchoForm({ ...echoForm, cooldown: Number(e.target.value) })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60"
                  />
                </div>
              </div>

              {/* Sonata Sets Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  أطقم السوناتا المرتبطة بهذا الإيكو
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-[#050914] border border-white/10 rounded-xl">
                  {sonataSets.map((s) => {
                    const isSelected = echoForm.sonataSets.includes(s.slug)
                    return (
                      <button
                        type="button"
                        key={s.slug}
                        onClick={() => toggleSetInEcho(s.slug)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-right transition-all ${
                          isSelected
                            ? 'bg-[#00c8ff]/20 text-[#00c8ff] border border-[#00c8ff]/40'
                            : 'bg-white/[0.02] text-slate-400 hover:text-white border border-transparent'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${isSelected ? 'border-[#00c8ff] bg-[#00c8ff]' : 'border-slate-600'}`}>
                          {isSelected && <Check size={10} className="text-black font-black" />}
                        </span>
                        <span className="truncate">{s.nameAr || s.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الوصف / مهارة الإيكو بالعربية
                </label>
                <textarea
                  rows={3}
                  value={echoForm.descriptionAr}
                  onChange={(e) => setEchoForm({ ...echoForm, descriptionAr: e.target.value })}
                  className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الوصف بالإنجليزية
                </label>
                <textarea
                  rows={2}
                  value={echoForm.description}
                  onChange={(e) => setEchoForm({ ...echoForm, description: e.target.value })}
                  className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="echo-published"
                  checked={echoForm.isPublished}
                  onChange={(e) => setEchoForm({ ...echoForm, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#00c8ff]"
                />
                <label htmlFor="echo-published" className="text-xs font-bold text-slate-300 cursor-pointer">
                  نشر هذا الإيكو وجعله مرئياً للمستخدمين
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEchoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingEcho}
                  className="px-6 py-2 rounded-xl bg-[#00c8ff] hover:bg-[#38bdf8] text-[#040814] font-black text-xs shadow-[0_0_15px_rgba(0,200,255,0.3)] disabled:opacity-50"
                >
                  {savingEcho ? 'جاري الحفظ...' : 'حفظ الإيكو'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CREATE / EDIT SONATA SET
          ───────────────────────────────────────────────────────────── */}
      {setModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#090e1c] border border-white/15 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#00c8ff]" />
                <span>{editingSet ? 'تعديل طقم السوناتا' : 'إضافة طقم سوناتا جديد'}</span>
              </h2>
              <button
                onClick={() => setSetModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSet} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اسم الطقم بالإنجليزية *
                  </label>
                  <input
                    type="text"
                    required
                    value={setForm.name}
                    onChange={(e) => setSetForm({ ...setForm, name: e.target.value })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اسم الطقم بالعربية
                  </label>
                  <input
                    type="text"
                    value={setForm.nameAr}
                    onChange={(e) => setSetForm({ ...setForm, nameAr: e.target.value })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    المعرف (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    value={setForm.slug}
                    onChange={(e) => setSetForm({ ...setForm, slug: e.target.value })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60 font-mono"
                  />
                </div>

              </div>

              <div className="space-y-4">
                <ImageUploadField
                  label="أيقونة طقم السونات (Sonata Set Icon)"
                  value={setForm.iconUrl || ''}
                  onChange={(url) => setSetForm({ ...setForm, iconUrl: url })}
                  folder="sonata-sets"
                  type="icon"
                  placeholder="/images/set/slug.webp"
                  helperText="اختر أيقونة الطقم من جهازك (PNG, WebP, SVG)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  تأثير القطعتين بالعربية (2-Piece Effect AR)
                </label>
                <textarea
                  rows={2}
                  value={setForm.twoPieceEffectAr}
                  onChange={(e) => setSetForm({ ...setForm, twoPieceEffectAr: e.target.value })}
                  className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  تأثير الـ 5 قطع بالعربية (5-Piece Effect AR)
                </label>
                <textarea
                  rows={3}
                  value={setForm.fivePieceEffectAr}
                  onChange={(e) => setSetForm({ ...setForm, fivePieceEffectAr: e.target.value })}
                  className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  تأثير القطعتين بالإنجليزية (2-Piece Effect EN)
                </label>
                <textarea
                  rows={2}
                  value={setForm.twoPieceEffect}
                  onChange={(e) => setSetForm({ ...setForm, twoPieceEffect: e.target.value })}
                  className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  تأثير الـ 5 قطع بالإنجليزية (5-Piece Effect EN)
                </label>
                <textarea
                  rows={2}
                  value={setForm.fivePieceEffect}
                  onChange={(e) => setSetForm({ ...setForm, fivePieceEffect: e.target.value })}
                  className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingSet}
                  className="px-6 py-2 rounded-xl bg-[#00c8ff] hover:bg-[#38bdf8] text-[#040814] font-black text-xs shadow-[0_0_15px_rgba(0,200,255,0.3)] disabled:opacity-50"
                >
                  {savingSet ? 'جاري الحفظ...' : 'حفظ طقم السوناتا'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
