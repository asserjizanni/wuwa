'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Swords, Plus, Trash2, Edit3, Save, X, Sparkles, User, Shield, Upload, Star
} from 'lucide-react'
import toast from 'react-hot-toast'
import ImageUploadField from '@/components/admin/ImageUploadField'

interface TeamMember {
  name: string
  slug?: string
  avatar?: string
  role?: string
  weapon?: string
  weaponIcon?: string
}

interface RotationStep {
  characterName: string
  action: string
}

interface TeamComp {
  id: string
  slug: string
  title: string
  titleAr?: string | null
  description?: string | null
  descriptionAr?: string | null
  members: TeamMember[] | any
  rotationGuide?: string | null
  rotationGuideAr?: string | null
  isFeatured: boolean
  isPublished: boolean
}

interface Character {
  id: string
  slug: string
  name: string
  nameAr?: string | null
  element: string
  portraitPath?: string | null
}

interface Weapon {
  id: string
  slug: string
  name: string
  nameAr?: string | null
  iconUrl?: string | null
}

export default function TeamsAdminClient({
  initialTeams,
  characters,
  weapons,
}: {
  initialTeams: TeamComp[]
  characters: Character[]
  weapons: Weapon[]
}) {
  const [teams, setTeams] = useState<TeamComp[]>(initialTeams)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activePickerSlot, setActivePickerSlot] = useState<number | null>(null)
  const [charSearch, setCharSearch] = useState('')

  const [formData, setFormData] = useState<Partial<TeamComp>>({
    slug: '',
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    members: [
      { name: '', role: 'مين ديس (Main DPS)', avatar: '', weapon: '', weaponIcon: '' },
      { name: '', role: 'ساب ديس (Sub DPS)', avatar: '', weapon: '', weaponIcon: '' },
      { name: '', role: 'دعم ومعالج (Healer / Buffer)', avatar: '', weapon: '', weaponIcon: '' },
    ],
    rotationGuideAr: '',
    isFeatured: false,
    isPublished: true,
  })

  const getCharImg = (slug?: string) => {
    if (!slug) return ''
    const s = slug.toLowerCase()
    const c = characters.find((ch) => ch.slug.toLowerCase() === s)
    if (c?.portraitPath && c.portraitPath.startsWith('data:')) return c.portraitPath
    return `/images/characters/${c?.slug || slug}.webp`
  }

  const handleStartCreate = () => {
    setFormData({
      slug: `team-${Date.now().toString().slice(-4)}`,
      title: 'Hypercarry Team',
      titleAr: 'فريق الهايبر كاري',
      descriptionAr: 'تشكيلة متوازنة لتحقيق أقصى قدر من إلحاق الضرر مع دعم مستمر.',
      members: [
        { name: '', role: 'مين ديس (Main DPS)', avatar: '', weapon: '', weaponIcon: '' },
        { name: '', role: 'ساب ديس (Sub DPS)', avatar: '', weapon: '', weaponIcon: '' },
        { name: '', role: 'دعم ومعالج (Healer / Buffer)', avatar: '', weapon: '', weaponIcon: '' },
      ],
      rotationGuideAr: '1. إنترو وباف المعالج\n2. سكل وفورتي بار الساب ديس\n3. إنترو وليبريشن المين ديس لإلحاق أقصى دمج',
      isFeatured: true,
      isPublished: true,
    })
    setIsEditing(true)
  }

  const handleStartEdit = (team: TeamComp) => {
    setFormData({
      ...team,
      members: Array.isArray(team.members) && team.members.length > 0 ? team.members : [
        { name: '', role: 'مين ديس (Main DPS)', avatar: '', weapon: '', weaponIcon: '' },
        { name: '', role: 'ساب ديس (Sub DPS)', avatar: '', weapon: '', weaponIcon: '' },
        { name: '', role: 'دعم ومعالج (Healer / Buffer)', avatar: '', weapon: '', weaponIcon: '' },
      ],
    })
    setIsEditing(true)
  }

  const handleSelectCharForSlot = (slotIdx: number, char: Character) => {
    const updated = [...(formData.members || [])]
    const img = (char.portraitPath && char.portraitPath.startsWith('data:'))
      ? char.portraitPath
      : `/images/characters/${char.slug}.webp`

    updated[slotIdx] = {
      ...updated[slotIdx],
      name: char.nameAr || char.name,
      slug: char.slug,
      avatar: img,
    }
    setFormData({ ...formData, members: updated })
    setActivePickerSlot(null)
  }

  const handleSave = async () => {
    if (!formData.slug || !formData.title) {
      toast.error('يرجى كتابة المعرف وعنوان الفريق')
      return
    }

    setSaving(true)
    const loadingToast = toast.loading('جاري حفظ الفريق...')
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ')

      toast.success('تم حفظ الفريق بنجاح!', { id: loadingToast })
      const updated = data.team
      setTeams((prev) => {
        const idx = prev.findIndex((t) => t.id === updated.id || t.slug === updated.slug)
        if (idx >= 0) {
          const clone = [...prev]
          clone[idx] = updated
          return clone
        }
        return [updated, ...prev]
      })
      setIsEditing(false)
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ', { id: loadingToast })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفريق؟')) return
    const loadingToast = toast.loading('جاري الحذف...')
    try {
      const res = await fetch(`/api/admin/teams?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('فشل الحذف')
      toast.success('تم حذف الفريق بنجاح', { id: loadingToast })
      setTeams((prev) => prev.filter((t) => t.id !== id))
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
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-tajawal">
                إدارة الفرق وتشكيلات القتال (Teams & Comps)
              </h1>
              <p className="text-xs text-slate-400">
                إضافة وتعديل الفرق الجاهزة، تحديد أدوار الشخصيات والأسلحة، وكتابة شروحات الروتيشن
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartCreate}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          إضافة فريق جديد
        </button>
      </div>

      {/* Team Form */}
      {isEditing && (
        <div className="p-6 rounded-2xl bg-[#070b16] border border-cyan-500/30 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-tajawal">
              <Edit3 className="w-5 h-5 text-cyan-400" />
              {formData.id ? 'تعديل الفريق' : 'إنشاء فريق قتال جديد'}
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
                {saving ? 'جاري الحفظ...' : 'حفظ الفريق'}
              </button>
            </div>
          </div>

          {/* Meta Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">المعرف (Slug)</label>
              <input
                type="text"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-mono"
                placeholder="hypercarry-team"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">اسم الفريق بالعربية</label>
              <input
                type="text"
                value={formData.titleAr || ''}
                onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-tajawal"
                placeholder="فريق الهايبر كاري الأساسي"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">اسم الفريق بالإنجليزية</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs"
                placeholder="Hypercarry Team"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">الوصف وفكرة الفريق</label>
            <textarea
              rows={2}
              value={formData.descriptionAr || ''}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-tajawal"
              placeholder="شرح تناغم الشخصيات..."
            />
          </div>

          {/* 3 Members Slots */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <h3 className="text-sm font-bold text-white font-tajawal">أعضاء الفريق (3 شخصيات):</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((slotIdx) => {
                const member: TeamMember = (formData.members || [])[slotIdx] || {
                  name: '',
                  role: '',
                  avatar: '',
                  weapon: '',
                  weaponIcon: '',
                }

                return (
                  <div key={slotIdx} className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 font-mono">الخانة #{slotIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePickerSlot(activePickerSlot === slotIdx ? null : slotIdx)
                          setCharSearch('')
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                      >
                        <User className="w-3.5 h-3.5" />
                        اختر من قاعدة البيانات
                      </button>
                    </div>

                    {/* Member Avatar and Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 relative shrink-0">
                        {member.avatar ? (
                          <Image
                            src={member.avatar}
                            alt={member.name || 'avatar'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={member.name || ''}
                          onChange={(e) => {
                            const updated = [...(formData.members || [])]
                            updated[slotIdx] = { ...updated[slotIdx], name: e.target.value }
                            setFormData({ ...formData, members: updated })
                          }}
                          placeholder="اسم الشخصية"
                          className="w-full px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-white font-bold text-xs font-tajawal"
                        />
                        <input
                          type="text"
                          value={member.role || ''}
                          onChange={(e) => {
                            const updated = [...(formData.members || [])]
                            updated[slotIdx] = { ...updated[slotIdx], role: e.target.value }
                            setFormData({ ...formData, members: updated })
                          }}
                          placeholder="الدور (مثال: مين ديس)"
                          className="w-full px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-cyan-300 text-xs font-tajawal"
                        />
                      </div>
                    </div>

                    {/* Image direct upload for avatar */}
                    <div>
                      <ImageUploadField
                        label="رابط أو رفع صورة العضو"
                        value={member.avatar || ''}
                        onChange={(url) => {
                          const updated = [...(formData.members || [])]
                          updated[slotIdx] = { ...updated[slotIdx], avatar: url }
                          setFormData({ ...formData, members: updated })
                        }}
                        folder="characters"
                        compact={true}
                        placeholder="/images/characters/..."
                      />
                    </div>

                    {/* Weapon Fields */}
                    <div className="space-y-1 pt-2 border-t border-white/5">
                      <label className="text-[10px] font-bold text-slate-400">السلاح المقترح:</label>
                      <input
                        type="text"
                        value={member.weapon || ''}
                        onChange={(e) => {
                          const updated = [...(formData.members || [])]
                          updated[slotIdx] = { ...updated[slotIdx], weapon: e.target.value }
                          setFormData({ ...formData, members: updated })
                        }}
                        placeholder="اسم السلاح المقترح"
                        className="w-full px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-slate-200 text-xs"
                      />
                    </div>

                    {/* Quick Character Picker popup */}
                    {activePickerSlot === slotIdx && (
                      <div className="absolute top-12 inset-x-2 z-20 p-3 rounded-2xl bg-[#03060f] border border-cyan-500 shadow-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300 font-tajawal">اختر شخصية:</span>
                          <input
                            type="text"
                            value={charSearch}
                            onChange={(e) => setCharSearch(e.target.value)}
                            placeholder="بحث..."
                            className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-white text-xs w-36 font-tajawal"
                            autoFocus
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
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
                                onClick={() => handleSelectCharForSlot(slotIdx, c)}
                                className="p-1.5 rounded-xl bg-zinc-900/60 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 flex flex-col items-center gap-1 transition"
                              >
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-black relative">
                                  <Image
                                    src={getCharImg(c.slug)}
                                    alt={c.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 truncate w-full text-center font-tajawal">
                                  {c.nameAr || c.name}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rotation Guide */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">دليل الروتيشن (Rotation Guide)</label>
            <textarea
              rows={3}
              value={formData.rotationGuideAr || ''}
              onChange={(e) => setFormData({ ...formData, rotationGuideAr: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-tajawal font-mono"
              placeholder="خطوات التبديل وتفعيل المهارات بالترتيب..."
            />
          </div>
        </div>
      )}

      {/* Existing Teams List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white font-tajawal">الفرق وتشكيلات القتال المحفوظة</h2>
        {teams.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-white/10 text-slate-400">
            لا توجد تشكيلات فرق حالياً. اضغط على &quot;إضافة فريق جديد&quot; لإنشاء أول تشكيلة.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-[#090d1a] border border-white/10 hover:border-cyan-500/30 transition space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white font-tajawal">{t.titleAr || t.title}</h3>
                    <p className="text-xs text-slate-400 font-tajawal mt-1">{t.descriptionAr || t.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(t)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-white/10"
                      title="تعديل الفريق"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                      title="حذف الفريق"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Team Members Preview */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                  {(Array.isArray(t.members) ? t.members : []).map((m: TeamMember, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-900 relative shrink-0">
                        {m.avatar ? (
                          <Image src={m.avatar} alt={m.name || 'm'} fill className="object-cover" unoptimized />
                        ) : (
                          <User className="w-4 h-4 m-2 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate font-tajawal">{m.name || 'عضو'}</div>
                        <div className="text-[10px] text-slate-400 truncate font-tajawal">{m.role || ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
