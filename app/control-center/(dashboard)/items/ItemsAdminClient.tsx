'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Package, Search, Plus, Edit2, Trash2, Check, X, Upload, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import ImageUploadField from '@/components/admin/ImageUploadField'

interface Item {
  id: string
  slug: string
  name: string
  nameAr: string | null
  category: string
  rarity: number
  iconUrl: string | null
  isPublished: boolean
  description?: string | null
  source?: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  ASCENSION: 'صعود الشخصية',
  FORGERY: 'مواد الصياغة',
  BOSS_MATERIAL: 'مواد البوص',
  COMMON: 'مواد شائعة',
  WEEKLY_BOSS: 'بوص أسبوعي',
  CURRENCY: 'العملة',
  SPECIAL: 'مواد خاصة',
  SKILL: 'مواد السكل',
  ECHO: 'الإيكو',
}

const RARITY_COLORS: Record<number, string> = {
  1: '#9E9E9E',
  2: '#4CAF50',
  3: '#2196F3',
  4: '#9C27B0',
  5: '#FF9800',
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS)

export default function ItemsAdminClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    nameAr: '',
    slug: '',
    category: 'COMMON',
    rarity: 3,
    iconUrl: '',
    description: '',
    source: '',
    isPublished: true,
  })

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.nameAr && item.nameAr.includes(search)) ||
        item.slug.includes(search.toLowerCase())
      const matchesCat = !selectedCategory || item.category === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [items, search, selectedCategory])

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, Item[]> = {}
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    }
    return groups
  }, [filtered])

  const openCreate = () => {
    setEditingItem(null)
    setForm({
      name: '',
      nameAr: '',
      slug: '',
      category: 'COMMON',
      rarity: 3,
      iconUrl: '',
      description: '',
      source: '',
      isPublished: true,
    })
    setModalOpen(true)
  }

  const openEdit = (item: Item) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      nameAr: item.nameAr || '',
      slug: item.slug,
      category: item.category,
      rarity: item.rarity,
      iconUrl: item.iconUrl || '',
      description: item.description || '',
      source: item.source || '',
      isPublished: item.isPublished,
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/items', {
        method: editingItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem ? { id: editingItem.id, ...form } : form),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'فشل الحفظ')
      }
      const saved = await res.json()
      if (editingItem) {
        setItems((prev) => prev.map((it) => (it.id === saved.id ? saved : it)))
        toast.success('تم تحديث العنصر بنجاح')
      } else {
        setItems((prev) => [saved, ...prev])
        toast.success('تمت إضافة العنصر بنجاح')
      }
      setModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: Item) => {
    if (!confirm(`هل أنت متأكد من حذف "${item.nameAr || item.name}"؟`)) return
    try {
      const res = await fetch(`/api/admin/items?id=${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('فشل الحذف')
      setItems((prev) => prev.filter((it) => it.id !== item.id))
      toast.success('تم الحذف')
    } catch {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-cyan-400" />
            إدارة المواد والعناصر
          </h1>
          <p className="text-sm text-slate-400">{items.length} عنصر في قاعدة البيانات</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          إضافة عنصر جديد
        </button>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو المعرف..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            dir="auto"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
              !selectedCategory
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-zinc-900/80 border border-white/10 text-slate-400 hover:bg-white/5'
            }`}
          >
            الكل ({items.length})
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat).length
            if (!count) return null
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-zinc-900/80 border border-white/10 text-slate-400 hover:bg-white/5'
                }`}
              >
                {CATEGORY_LABELS[cat] || cat} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Grouped Items */}
      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="space-y-3">
          <h2 className="text-sm font-bold text-slate-300 px-1 border-b border-white/10 pb-2">
            {CATEGORY_LABELS[cat] || cat} — {catItems.length} عنصر
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {catItems.map((item) => (
              <div
                key={item.id}
                className="group relative p-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] hover:border-white/20 transition"
              >
                {/* Rarity bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
                  style={{ backgroundColor: RARITY_COLORS[item.rarity] || '#9E9E9E' }}
                />

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center">
                    {item.iconUrl ? (
                      <Image
                        src={item.iconUrl}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <Package className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-white leading-tight line-clamp-1 font-tajawal">
                      {item.nameAr || item.name}
                    </p>
                    <p className="text-[9px] text-slate-500 truncate">{item.name}</p>
                  </div>
                </div>

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/70 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 transition"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="py-20 text-center text-slate-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد نتائج</p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                {editingItem ? 'تعديل العنصر' : 'إضافة عنصر جديد'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-tajawal">الاسم الإنجليزي *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setForm((f) => ({
                        ...f,
                        name,
                        slug: editingItem ? f.slug : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                      }))
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-tajawal">الاسم العربي</label>
                  <input
                    value={form.nameAr}
                    onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 font-tajawal"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Slug (معرف فريد)</label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-cyan-500/50"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-tajawal">التصنيف</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none"
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-tajawal">الندرة (1-5 نجوم)</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, rarity: r }))}
                        className={`p-1.5 rounded-lg transition ${form.rarity >= r ? 'text-amber-400' : 'text-slate-600'}`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Icon upload */}
              <ImageUploadField
                label="أيقونة العنصر"
                value={form.iconUrl}
                onChange={(url) => setForm((f) => ({ ...f, iconUrl: url }))}
                folder="materials"
                type="icon"
                placeholder="/images/materials/slug.webp"
                helperText="ارفع أيقونة العنصر من جهازك"
              />

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-tajawal">المصدر (اختياري)</label>
                <input
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  placeholder="مثال: Tacet Field، Forgery Challenge..."
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 font-tajawal"
                  dir="rtl"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                  className={`w-10 h-6 rounded-full transition flex items-center px-0.5 ${
                    form.isPublished ? 'bg-cyan-500' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      form.isPublished ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-sm text-white font-tajawal">منشور (مرئي في الاختيار)</span>
              </label>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {saving ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
