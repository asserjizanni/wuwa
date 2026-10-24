'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Plus, Search, Edit2, Trash2, Radio, Check, X,
  ChevronLeft, ChevronRight, Shield, Swords, Heart
} from 'lucide-react'
import toast from 'react-hot-toast'
import ImageUploadField from '@/components/admin/ImageUploadField'

interface Enemy {
  id: string
  slug: string
  name: string
  nameAr: string | null
  enemyClass: string | null
  elements: string[]
  hp: number | null
  atk: number | null
  def: number | null
  description: string | null
  descriptionAr: string | null
  iconUrl: string | null
  artworkUrl: string | null
  isPublished: boolean
}

const ENEMY_CLASSES = ['ALL', 'Calamity', 'Overlord', 'Elite', 'Common']
const ALL_ELEMENTS = ['Aero', 'Spectro', 'Fusion', 'Electro', 'Glacio', 'Havoc']

export default function EnemiesAdminClient({ initialEnemies }: { initialEnemies: Enemy[] }) {
  const [enemies, setEnemies] = useState<Enemy[]>(initialEnemies)
  const [search, setSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState('ALL')
  const [selectedElement, setSelectedElement] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 24

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEnemy, setEditingEnemy] = useState<Enemy | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    slug: '',
    enemyClass: 'Common',
    elements: [] as string[],
    hp: 0,
    atk: 0,
    def: 0,
    description: '',
    descriptionAr: '',
    iconUrl: '',
    artworkUrl: '',
    isPublished: true,
  })

  const openCreateModal = () => {
    setEditingEnemy(null)
    setFormData({
      name: '',
      nameAr: '',
      slug: '',
      enemyClass: 'Common',
      elements: [],
      hp: 10000,
      atk: 500,
      def: 300,
      description: '',
      descriptionAr: '',
      iconUrl: '',
      artworkUrl: '',
      isPublished: true,
    })
    setModalOpen(true)
  }

  const openEditModal = (en: Enemy) => {
    setEditingEnemy(en)
    setFormData({
      name: en.name,
      nameAr: en.nameAr || '',
      slug: en.slug,
      enemyClass: en.enemyClass || 'Common',
      elements: Array.isArray(en.elements) ? en.elements : [],
      hp: en.hp || 0,
      atk: en.atk || 0,
      def: en.def || 0,
      description: en.description || '',
      descriptionAr: en.descriptionAr || '',
      iconUrl: en.iconUrl || '',
      artworkUrl: en.artworkUrl || '',
      isPublished: en.isPublished,
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/admin/enemies', {
        method: editingEnemy ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingEnemy?.id,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'فشلت العملية')
      }

      const saved = await res.json()
      if (editingEnemy) {
        setEnemies(prev => prev.map(item => item.id === saved.id ? saved : item))
        toast.success('تم تحديث بيانات العدو بنجاح')
      } else {
        setEnemies(prev => [saved, ...prev])
        toast.success('تمت إضافة العدو بنجاح')
      }
      setModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (en: Enemy) => {
    if (!confirm(`هل أنت متأكد من حذف "${en.nameAr || en.name}"؟`)) return

    try {
      const res = await fetch(`/api/admin/enemies?id=${en.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('فشل الحذف')

      setEnemies(prev => prev.filter(item => item.id !== en.id))
      toast.success('تم حذف العدو بنجاح')
    } catch {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  const toggleElement = (el: string) => {
    setFormData(prev => {
      const exists = prev.elements.includes(el)
      if (exists) {
        return { ...prev, elements: prev.elements.filter(x => x !== el) }
      } else {
        return { ...prev, elements: [...prev.elements, el] }
      }
    })
  }

  // Filter enemies
  const filtered = enemies.filter(en => {
    const matchesSearch =
      en.name.toLowerCase().includes(search.toLowerCase()) ||
      (en.nameAr && en.nameAr.includes(search)) ||
      en.slug.toLowerCase().includes(search.toLowerCase())
    const matchesClass = selectedClass === 'ALL' || en.enemyClass === selectedClass
    const matchesElement =
      selectedElement === 'ALL' ||
      (Array.isArray(en.elements) && en.elements.some(e => e.toLowerCase() === selectedElement.toLowerCase()))
    return matchesSearch && matchesClass && matchesElement
  })

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1
  const paginatedEnemies = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const getClassBadgeStyle = (cls: string | null) => {
    switch (cls) {
      case 'Calamity':
        return 'bg-red-500/20 text-red-400 border-red-500/40'
      case 'Overlord':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      case 'Elite':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    }
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث بالاسم العربي أو الإنجليزي للعدو..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[#070c18] border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00c8ff]/50 transition-colors"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c8ff] hover:bg-[#38bdf8] text-[#040814] font-black text-sm transition-all shadow-[0_0_15px_rgba(0,200,255,0.25)]"
        >
          <Plus size={18} />
          <span>إضافة زعيم / عدو جديد</span>
        </button>
      </div>

      {/* Class & Element filters */}
      <div className="flex items-center gap-2 flex-wrap bg-[#070c18] border border-white/[0.08] p-3 rounded-2xl">
        <span className="text-xs text-slate-400 font-bold ml-1">التصنيف:</span>
        {ENEMY_CLASSES.map((cls) => (
          <button
            key={cls}
            onClick={() => { setSelectedClass(cls); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedClass === cls
                ? 'bg-[#00c8ff] text-[#040814] shadow-[0_0_10px_rgba(0,200,255,0.3)]'
                : 'bg-white/[0.04] text-slate-400 hover:text-white'
            }`}
          >
            {cls === 'ALL' ? 'الكل' : cls}
          </button>
        ))}

        <div className="h-4 w-px bg-white/10 mx-2 hidden sm:block" />

        <span className="text-xs text-slate-400 font-bold ml-1">العنصر:</span>
        {['ALL', ...ALL_ELEMENTS].map((el) => (
          <button
            key={el}
            onClick={() => { setSelectedElement(el); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedElement === el
                ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'bg-white/[0.04] text-slate-400 hover:text-white'
            }`}
          >
            {el === 'ALL' ? 'الكل' : el}
          </button>
        ))}
      </div>

      {/* Enemies Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {paginatedEnemies.map((en) => (
          <div
            key={en.id}
            className="bg-[#070c18] border border-white/[0.08] hover:border-[#00c8ff]/40 rounded-2xl p-4 flex flex-col justify-between transition-all group hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
          >
            <div>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 overflow-hidden relative shrink-0 flex items-center justify-center">
                  {en.iconUrl || en.artworkUrl ? (
                    <Image
                      src={en.iconUrl || en.artworkUrl || ''}
                      alt={en.name}
                      fill
                      className="object-contain p-1"
                      onError={(e) => {
                        (e.target as any).style.display = 'none'
                      }}
                    />
                  ) : (
                    <Radio className="w-6 h-6 text-slate-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getClassBadgeStyle(en.enemyClass)}`}>
                      {en.enemyClass || 'Common'}
                    </span>
                    {!en.isPublished && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        مسودة
                      </span>
                    )}
                  </div>

                  <h3 className="text-white font-bold text-sm truncate leading-snug">
                    {en.nameAr || en.name}
                  </h3>
                  <p className="text-slate-400 text-xs truncate font-mono mt-0.5">
                    {en.name}
                  </p>
                </div>
              </div>

              {/* Elements */}
              {en.elements && en.elements.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mb-3">
                  {en.elements.map((el) => (
                    <span
                      key={el}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.04] text-slate-300 border border-white/[0.08]"
                    >
                      {el}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats badges */}
              {(en.hp || en.atk || en.def) && (
                <div className="grid grid-cols-3 gap-1 bg-white/[0.02] border border-white/[0.05] rounded-xl p-2 mb-3 text-center">
                  <div>
                    <span className="block text-[9px] text-slate-500">HP</span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {en.hp ? en.hp.toLocaleString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500">ATK</span>
                    <span className="text-[11px] font-mono text-amber-400 font-bold">
                      {en.atk ? en.atk.toLocaleString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500">DEF</span>
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">
                      {en.def ? en.def.toLocaleString() : '-'}
                    </span>
                  </div>
                </div>
              )}

              {en.descriptionAr && (
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {en.descriptionAr}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-auto">
              <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                {en.slug}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(en)}
                  className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-[#00c8ff]/20 text-slate-300 hover:text-[#00c8ff] transition-colors"
                  title="تعديل"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(en)}
                  className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
                  title="حذف"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-[#070c18] border border-white/[0.08] px-4 py-3 rounded-2xl">
          <p className="text-xs text-slate-400">
            عرض {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, filtered.length)} من أصل {filtered.length} عدو
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

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CREATE / EDIT ENEMY
          ───────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#090e1c] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#00c8ff]" />
                <span>{editingEnemy ? 'تعديل بيانات العدو / الزعيم' : 'إضافة عدو أو زعيم جديد'}</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الاسم بالإنجليزية *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الاسم بالعربية
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
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
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    التصنيف (Class)
                  </label>
                  <select
                    value={formData.enemyClass}
                    onChange={(e) => setFormData({ ...formData, enemyClass: e.target.value })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60"
                  >
                    <option value="Common">Common</option>
                    <option value="Elite">Elite</option>
                    <option value="Overlord">Overlord</option>
                    <option value="Calamity">Calamity</option>
                  </select>
                </div>
              </div>

              {/* Elements selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  عناصر العدو (Elements)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {ALL_ELEMENTS.map((el) => {
                    const isSelected = formData.elements.includes(el)
                    return (
                      <button
                        type="button"
                        key={el}
                        onClick={() => toggleElement(el)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#00c8ff] text-[#040814] shadow-[0_0_12px_rgba(0,200,255,0.3)]'
                            : 'bg-[#050914] border border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check size={12} className="stroke-[3]" />}
                        <span>{el}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    نقاط الصحة (HP)
                  </label>
                  <input
                    type="number"
                    value={formData.hp}
                    onChange={(e) => setFormData({ ...formData, hp: Number(e.target.value) })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الهجوم (ATK)
                  </label>
                  <input
                    type="number"
                    value={formData.atk}
                    onChange={(e) => setFormData({ ...formData, atk: Number(e.target.value) })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الدفاع (DEF)
                  </label>
                  <input
                    type="number"
                    value={formData.def}
                    onChange={(e) => setFormData({ ...formData, def: Number(e.target.value) })}
                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ImageUploadField
                  label="أيقونة العدو (Enemy Icon)"
                  value={formData.iconUrl || ''}
                  onChange={(url) => setFormData({ ...formData, iconUrl: url })}
                  folder="enemies"
                  type="icon"
                  placeholder="https://... or /images/..."
                  helperText="اختر أيقونة العدو من جهازك (PNG, WebP, SVG)"
                />

                <ImageUploadField
                  label="العمل الفني للعدو (Artwork URL)"
                  value={formData.artworkUrl || ''}
                  onChange={(url) => setFormData({ ...formData, artworkUrl: url })}
                  folder="enemies"
                  type="artwork"
                  aspectRatio="banner"
                  placeholder="https://... or /images/..."
                  helperText="اختر صورة العرض أو البانر للعدو من جهازك"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الوصف بالعربية
                </label>
                <textarea
                  rows={3}
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الوصف بالإنجليزية
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00c8ff]/60 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="enemy-published"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#00c8ff]"
                />
                <label htmlFor="enemy-published" className="text-xs font-bold text-slate-300 cursor-pointer">
                  نشر هذا العدو وجعله متاحاً في النظام
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-[#00c8ff] hover:bg-[#38bdf8] text-[#040814] font-black text-xs shadow-[0_0_15px_rgba(0,200,255,0.3)] disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ بيانات العدو'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
