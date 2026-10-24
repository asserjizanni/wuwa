'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Trophy, Plus, Trash2, Edit3, Save, X, Eye, Check, ChevronDown, Sparkles, Layers
} from 'lucide-react'
import toast from 'react-hot-toast'

interface TierItem {
  tier: string
  titleAr: string
  description?: string
  characters: string[]
}

interface TierList {
  id: string
  slug: string
  title: string
  titleAr?: string | null
  gameVersion: string
  category: string
  description?: string | null
  tiers: TierItem[] | any
  isPublished: boolean
}

interface Character {
  id: string
  slug: string
  name: string
  nameAr?: string | null
  element: string
  portraitPath?: string | null
  rarity: string
}

export default function TierListsAdminClient({
  initialTierLists,
  characters,
}: {
  initialTierLists: TierList[]
  characters: Character[]
}) {
  const [tierLists, setTierLists] = useState<TierList[]>(initialTierLists)
  const [selectedList, setSelectedList] = useState<TierList | null>(
    initialTierLists[0] || null
  )
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTierAddIdx, setActiveTierAddIdx] = useState<number | null>(null)
  const [charSearch, setCharSearch] = useState('')

  // Current editing tier list form
  const [formData, setFormData] = useState<Partial<TierList>>({
    slug: '',
    title: '',
    titleAr: '',
    gameVersion: '1.4',
    category: 'overall',
    description: '',
    tiers: [],
    isPublished: true,
  })

  const charMap = new Map<string, Character>()
  characters.forEach((c) => {
    charMap.set(c.slug.toLowerCase(), c)
  })

  const getCharImg = (slug: string) => {
    const s = slug.toLowerCase()
    const c = charMap.get(s) || charMap.get(s.replace(/^the-/, '')) || charMap.get(`the-${s}`)
    if (c?.portraitPath && c.portraitPath.startsWith('data:')) return c.portraitPath
    return `/images/characters/${c?.slug || slug}.webp`
  }

  const getCharName = (slug: string) => {
    const s = slug.toLowerCase()
    const c = charMap.get(s) || charMap.get(s.replace(/^the-/, '')) || charMap.get(`the-${s}`)
    return c?.nameAr || c?.name || slug
  }

  const handleStartCreate = () => {
    setFormData({
      slug: `tier-list-v${Date.now().toString().slice(-4)}`,
      title: 'Current Meta Tier List',
      titleAr: 'تصنيف الميتا الحالي',
      gameVersion: '1.4',
      category: 'overall',
      description: 'تصنيف شخصيات وذرينغ ويفز حسب كفاءة إلحاق الضرر والدعم الجماعي في برج الشدائد.',
      tiers: [
        { tier: 'T0', titleAr: 'القمة المطلقة (S+ Tier)', description: 'أقوى الشخصيات في اللعبة حالياً', characters: [] },
        { tier: 'T0.5', titleAr: 'شبه مثالي (S Tier)', description: 'شخصيات محورية عالية الفعالية', characters: [] },
        { tier: 'T1', titleAr: 'قوي وموثوق (A Tier)', description: 'شخصيات ممتازة لأي فريق', characters: [] },
        { tier: 'T2', titleAr: 'جيد مع استثمار (B Tier)', description: 'شخصيات جيدة عند بنائها بشكل صحيح', characters: [] },
      ],
      isPublished: true,
    })
    setIsEditing(true)
  }

  const handleStartEdit = (tl: TierList) => {
    setFormData({
      ...tl,
      tiers: Array.isArray(tl.tiers) ? tl.tiers : [],
    })
    setIsEditing(true)
  }

  const handleAddTier = () => {
    const currentTiers = [...(formData.tiers || [])]
    currentTiers.push({
      tier: `T${currentTiers.length}`,
      titleAr: `تصنيف T${currentTiers.length}`,
      description: '',
      characters: [],
    })
    setFormData({ ...formData, tiers: currentTiers })
  }

  const handleRemoveTier = (idx: number) => {
    const currentTiers = (formData.tiers || []).filter((_: any, i: number) => i !== idx)
    setFormData({ ...formData, tiers: currentTiers })
  }

  const handleAddCharToTier = (tierIdx: number, charSlug: string) => {
    const currentTiers = [...(formData.tiers || [])]
    const currentChars = [...(currentTiers[tierIdx].characters || [])]
    if (!currentChars.includes(charSlug)) {
      currentChars.push(charSlug)
      currentTiers[tierIdx].characters = currentChars
      setFormData({ ...formData, tiers: currentTiers })
      toast.success(`تمت إضافة ${getCharName(charSlug)}`)
    } else {
      toast.error('الشخصية مضافة بالفعل في هذا التصنيف')
    }
    setActiveTierAddIdx(null)
  }

  const handleRemoveCharFromTier = (tierIdx: number, charIdx: number) => {
    const currentTiers = [...(formData.tiers || [])]
    currentTiers[tierIdx].characters = currentTiers[tierIdx].characters.filter((_: any, i: number) => i !== charIdx)
    setFormData({ ...formData, tiers: currentTiers })
  }

  const handleSave = async () => {
    if (!formData.slug || !formData.title) {
      toast.error('يرجى ملء المعرف والعنوان')
      return
    }

    setSaving(true)
    const loadingToast = toast.loading('جاري حفظ التصنيف في قاعدة البيانات...')
    try {
      const res = await fetch('/api/admin/tier-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ')

      toast.success('تم حفظ التصنيف بنجاح!', { id: loadingToast })
      // Update local state
      const updatedList = data.tierList
      setTierLists((prev) => {
        const idx = prev.findIndex((t) => t.id === updatedList.id || t.slug === updatedList.slug)
        if (idx >= 0) {
          const clone = [...prev]
          clone[idx] = updatedList
          return clone
        }
        return [updatedList, ...prev]
      })
      setSelectedList(updatedList)
      setIsEditing(false)
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ', { id: loadingToast })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا التصنيف؟')) return
    const loadingToast = toast.loading('جاري الحذف...')
    try {
      const res = await fetch(`/api/admin/tier-lists?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('فشل الحذف')
      toast.success('تم حذف التصنيف بنجاح', { id: loadingToast })
      setTierLists((prev) => prev.filter((t) => t.id !== id))
      if (selectedList?.id === id) {
        setSelectedList(tierLists.find((t) => t.id !== id) || null)
      }
      setIsEditing(false)
    } catch (err: any) {
      toast.error(err.message || 'خطأ في الحذف', { id: loadingToast })
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#090d1a] border border-white/10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-tajawal">
                إدارة التصنيفات (Tier Lists)
              </h1>
              <p className="text-xs text-slate-400">
                التحكم الكامل في قوائم تقييم وتصنيف شخصيات اللعبة وترتيب الرتب (T0, T0.5, T1, T2)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartCreate}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          إنشاء تصنيف جديد
        </button>
      </div>

      {/* Editor Modal or Inline View */}
      {isEditing ? (
        <div className="p-6 rounded-2xl bg-[#070b16] border border-cyan-500/30 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-tajawal">
              <Edit3 className="w-5 h-5 text-cyan-400" />
              {formData.id ? 'تعديل التصنيف' : 'إنشاء تصنيف جديد'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-slate-300 hover:text-white text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          </div>

          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">المعرف (Slug)</label>
              <input
                type="text"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-mono"
                placeholder="overall-tier-list"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">العنوان بالعربية</label>
              <input
                type="text"
                value={formData.titleAr || ''}
                onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-tajawal"
                placeholder="تصنيف شخصيات وذرينغ ويفز"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">العنوان بالإنجليزية</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs"
                placeholder="Wuthering Waves Character Tier List"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">الإصدار (Game Version)</label>
              <input
                type="text"
                value={formData.gameVersion || '1.4'}
                onChange={(e) => setFormData({ ...formData, gameVersion: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-mono"
                placeholder="1.4"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">الوصف</label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-tajawal"
              placeholder="وصف معايير التقييم..."
            />
          </div>

          {/* Tiers Builder */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-tajawal">
                <Layers className="w-4 h-4 text-amber-400" />
                رتب التصنيف (Tiers)
              </h3>
              <button
                type="button"
                onClick={handleAddTier}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 border border-white/10"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة رتبة جديدة
              </button>
            </div>

            <div className="space-y-4">
              {(formData.tiers || []).map((tItem: TierItem, tIdx: number) => (
                <div key={tIdx} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={tItem.tier}
                        onChange={(e) => {
                          const updated = [...(formData.tiers || [])]
                          updated[tIdx].tier = e.target.value
                          setFormData({ ...formData, tiers: updated })
                        }}
                        className="w-20 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-amber-500/40 text-amber-400 font-bold text-center text-xs font-mono"
                        placeholder="T0"
                      />
                      <input
                        type="text"
                        value={tItem.titleAr || ''}
                        onChange={(e) => {
                          const updated = [...(formData.tiers || [])]
                          updated[tIdx].titleAr = e.target.value
                          setFormData({ ...formData, tiers: updated })
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs font-bold font-tajawal"
                        placeholder="عنوان الرتبة (مثال: القمة المطلقة)"
                      />
                      <input
                        type="text"
                        value={tItem.description || ''}
                        onChange={(e) => {
                          const updated = [...(formData.tiers || [])]
                          updated[tIdx].description = e.target.value
                          setFormData({ ...formData, tiers: updated })
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-slate-300 text-xs font-tajawal"
                        placeholder="شرح الرتبة..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(tIdx)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20"
                      title="حذف الرتبة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Character chips in this tier */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                    {(tItem.characters || []).map((slug: string, cIdx: number) => (
                      <div
                        key={cIdx}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 border border-white/10 text-xs"
                      >
                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-black/40 relative shrink-0">
                          <Image
                            src={getCharImg(slug)}
                            alt={slug}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span className="font-bold text-white font-tajawal">{getCharName(slug)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCharFromTier(tIdx, cIdx)}
                          className="p-0.5 text-slate-400 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTierAddIdx(activeTierAddIdx === tIdx ? null : tIdx)
                        setCharSearch('')
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      إضافة شخصية
                    </button>
                  </div>

                  {/* Quick Character Picker for this tier */}
                  {activeTierAddIdx === tIdx && (
                    <div className="p-3 rounded-xl bg-[#03060f] border border-cyan-500/40 space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300 font-tajawal">
                          اختر الشخصية لإضافتها إلى {tItem.tier}:
                        </span>
                        <input
                          type="text"
                          value={charSearch}
                          onChange={(e) => setCharSearch(e.target.value)}
                          placeholder="ابحث عن الشخصية..."
                          className="px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-white text-xs w-48 font-tajawal"
                          autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1">
                        {characters
                          .filter(
                            (c) =>
                              !charSearch ||
                              c.name.toLowerCase().includes(charSearch.toLowerCase()) ||
                              (c.nameAr && c.nameAr.includes(charSearch))
                          )
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleAddCharToTier(tIdx, c.slug)}
                              className="p-2 rounded-xl bg-zinc-900/60 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 flex flex-col items-center gap-1 transition group"
                            >
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-black relative">
                                <Image
                                  src={getCharImg(c.slug)}
                                  alt={c.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <span className="text-[11px] font-bold text-slate-300 group-hover:text-cyan-300 truncate w-full text-center font-tajawal">
                                {c.nameAr || c.name}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Existing Tier Lists */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white font-tajawal">التصنيفات المحفوظة</h2>
        {tierLists.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-white/10 text-slate-400">
            لا توجد تصنيفات حالياً. انقر على &quot;إنشاء تصنيف جديد&quot; للبدء.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tierLists.map((tl) => (
              <div
                key={tl.id}
                className="p-5 rounded-2xl bg-[#090d1a] border border-white/10 hover:border-cyan-500/30 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
                      v{tl.gameVersion}
                    </span>
                    <h3 className="text-base font-bold text-white font-tajawal">
                      {tl.titleAr || tl.title}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">({tl.slug})</span>
                  </div>
                  <p className="text-xs text-slate-400 font-tajawal max-w-2xl">{tl.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                    <span>عدد الرتب: {Array.isArray(tl.tiers) ? tl.tiers.length : 0}</span>
                    <span>•</span>
                    <span>الحالة: {tl.isPublished ? 'منشور 🟢' : 'مسودة ⚪'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(tl)}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 border border-white/10 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    تعديل الرتب والشخصيات
                  </button>
                  <button
                    onClick={() => handleDelete(tl.id)}
                    className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
