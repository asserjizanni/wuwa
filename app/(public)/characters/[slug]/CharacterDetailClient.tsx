'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Star, Shield, Zap, Heart, Activity, Swords, Layers,
  Sparkles, CheckCircle2, ChevronLeft, ChevronRight, UserCheck, ChevronDown,
  Users, BarChart3, Package, Play, Eye, Lock
} from 'lucide-react'
import ElementBadge from '@/components/ui/ElementBadge'
import WeaponBadge from '@/components/ui/WeaponBadge'
import CharacterCard from '@/components/characters/CharacterCard'
import { rarityToStars } from '@/lib/utils'

interface StatRow {
  level: number
  hp: string
  atk: string
  def: string
  energy: string
  critRate: string
  critDmg: string
  healing: string
  elementDmg: string
  tuneBreak: string
  offTune: string
}

interface Talent {
  key?: string
  category: string
  name: string
  icon?: string
  description: string
}

interface Sequence {
  node: number
  name: string
  icon?: string
  description: string
  priorityStars?: number
}

interface Synergy {
  slug: string
  name: string
  icon?: string
}

interface Material {
  name: string
  amount: string
  icon?: string
}

interface WeaponDPS {
  rank: number
  name: string
  refinement: string
  icon?: string
  rarity?: number
  statsText?: string
  relativeDps: string
  echoStat?: string
  avgDamage?: string
  effect?: string
}

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

interface RotationGroup {
  title: string
  steps: RotationStep[]
}

interface TeamComp {
  id?: string
  name: string
  rank?: number
  dps?: string
  dpsNote?: string
  members: TeamMember[]
  rotations?: RotationGroup[]
}

interface DamageSegment {
  key: string
  label: string
  percentage: string
  color: string
}

interface DamageDistribution {
  heavy?: string
  liberation?: string
  basic?: string
  skill?: string
  outro?: string
  intro?: string
  tuneBreak?: string
  echo?: string
  segments?: DamageSegment[]
}

interface EchoRecommendation {
  primarySet?: { name: string; icon?: string; desc?: string }
  secondarySet?: { name: string; icon?: string; desc?: string }
  mainEcho?: { name: string; icon?: string; desc?: string }
  cost4Stats?: string[]
  cost3Stats?: string[]
  cost1Stats?: string[]
  substatsPriority?: string[]
}

interface CharacterData {
  id: string
  name: string
  nameAr?: string | null
  slug: string
  element: string
  weaponType: string
  rarity: string
  portraitPath: string | null
  backgroundPath: string | null
  description: string | null
  descriptionAr?: string | null
  role?: string | null
  version?: string | null
  isPublished?: boolean
  isComingSoon?: boolean
  releaseVersion?: string | null
  stats?: any
  skills?: Talent[]
  sequences?: Sequence[]
  teamComps?: Synergy[]
  teams?: TeamComp[]
  ascensionMaterials?: Material[]
  skillMaterials?: Material[]
  allMaterials?: Material[]
  recommendedEchoes?: EchoRecommendation
  weaponsDPS?: WeaponDPS[]
  recommendedWeapons?: any
  damageDistribution?: DamageDistribution | null
  buildTips?: string | null
}

interface Props {
  character: CharacterData
  relatedCharacters: any[]
}

const STAT_LEVELS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90]

export default function CharacterDetailClient({ character, relatedCharacters }: Props) {
  const [levelIndex, setLevelIndex] = useState(9) // Default: Lv. 90
  const [activeTab, setActiveTab] = useState<
    'overview' | 'talents' | 'sequences' | 'build' | 'teams' | 'calculations' | 'materials'
  >('overview')

  // Expanded team rotations state: map teamId -> boolean
  const [openRotations, setOpenRotations] = useState<Record<string, boolean>>({
    'team-0': true,
  })

  // Expanded weapon effect state: map index -> boolean
  const [openWeaponEffect, setOpenWeaponEffect] = useState<Record<number, boolean>>({})

  const toggleRotation = (teamKey: string) => {
    setOpenRotations(prev => ({ ...prev, [teamKey]: !prev[teamKey] }))
  }

  const toggleWeaponEffect = (idx: number) => {
    setOpenWeaponEffect(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const stars = rarityToStars(character.rarity)
  const isS5 = stars === 5
  const isComingSoon = Boolean(character.isComingSoon || character.isPublished === false)
  const safeRelated = Array.isArray(relatedCharacters) ? relatedCharacters : []

  // Parse stats from JSON rows if available
  const statsData: StatRow[] = (() => {
    if (character.stats?.rows && Array.isArray(character.stats.rows)) {
      return character.stats.rows.map((row: string[], idx: number) => ({
        level: character.stats.levels?.[idx] ?? STAT_LEVELS[idx] ?? idx * 10,
        hp: row[0] ?? '—',
        atk: row[1] ?? '—',
        def: row[2] ?? '—',
        energy: row[3] ?? '100',
        critRate: row[4] ?? '5%',
        critDmg: row[5] ?? '150%',
        healing: row[6] ?? '0%',
        elementDmg: row[7] ?? '0%',
        tuneBreak: row[8] ?? '0',
        offTune: row[9] ?? '100',
      }))
    }
    // Fallback computed progression if no custom rows
    return STAT_LEVELS.map((lvl) => {
      const mult = lvl / 90
      const baseHp = isS5 ? 10800 : 9200
      const baseAtk = isS5 ? 412 : 325
      const baseDef = isS5 ? 1120 : 980
      return {
        level: lvl,
        hp: Math.round(baseHp * (0.15 + 0.85 * mult)).toLocaleString(),
        atk: Math.round(baseAtk * (0.15 + 0.85 * mult)).toLocaleString(),
        def: Math.round(baseDef * (0.15 + 0.85 * mult)).toLocaleString(),
        energy: '100',
        critRate: '5%',
        critDmg: '150%',
        healing: '0%',
        elementDmg: '0%',
        tuneBreak: '0',
        offTune: '100',
      }
    })
  })()

  const currentStat = statsData[levelIndex] || statsData[statsData.length - 1]

  const talents = character.skills || []
  const sequences = character.sequences || []
  const weapons = character.weaponsDPS || []
  const echoes = character.recommendedEchoes
  const teams = character.teams || []
  const damageDist = character.damageDistribution
  const ascensionMaterials = character.ascensionMaterials || []
  const skillMaterials = character.skillMaterials || []
  const allMaterials = character.allMaterials || []

  // Ensure image URLs are valid
  const sanitizeImg = (src?: string | null) => {
    if (!src) return ''
    if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) return src
    return '/' + src
  }

  const isDataUrl = (src?: string | null) => Boolean(src && (src.startsWith('data:') || src.startsWith('blob:')))
  const fallbackImg = `/images/characters/${character.slug}.webp`
  const portraitSrc = character.portraitPath || (character as any).iconUrl || fallbackImg
  const backgroundSrc = character.backgroundPath || portraitSrc

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* ─────────────────────────────────────────────────────────────
          HERO BANNER
         ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        {backgroundSrc && (
          <div className="absolute inset-0 z-0 opacity-20 filter blur-sm">
            <Image
              src={sanitizeImg(backgroundSrc)}
              alt=""
              fill
              unoptimized={isDataUrl(backgroundSrc)}
              className="object-cover object-center"
              priority
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 mb-6 font-medium">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
              الرئيسية
            </Link>
            <ChevronLeft size={14} className="text-slate-600" />
            <Link href="/characters" className="hover:text-cyan-400 transition-colors">
              الشخصيات
            </Link>
            <ChevronLeft size={14} className="text-slate-600" />
            <span className="text-cyan-400 font-bold">{character.nameAr || character.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Text & Badges */}
            <div className="lg:col-span-8 space-y-5">
              {isComingSoon ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-black shadow-lg shadow-amber-500/10">
                  <Lock size={13} className="text-amber-400" />
                  <span>قريباً {character.releaseVersion ? `• تحديث ${character.releaseVersion}` : ''} - الدليل مقفل حالياً</span>
                </div>
              ) : character.role ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
                  <Sparkles size={13} />
                  <span>{character.role}</span>
                </div>
              ) : null}

              <div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-tajawal">
                  {character.nameAr || character.name}
                </h1>
                <p className="text-slate-400 text-base sm:text-lg font-mono mt-1 tracking-wider uppercase">
                  {character.name}
                </p>
              </div>

              {/* Badges: Element, Weapon, Rarity, Version */}
              <div className="flex flex-wrap items-center gap-3">
                <ElementBadge element={character.element as any} size="md" />
                <WeaponBadge weaponType={character.weaponType as any} size="md" />

                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={15} className="text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-amber-300 text-xs font-bold mr-1">{stars} نجوم</span>
                </div>

                {character.version && (
                  <span className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 text-xs font-mono">
                    إصدار v{character.version}
                  </span>
                )}
              </div>

              {/* Bio / Description */}
              {(character.descriptionAr || character.description) && (
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl bg-black/30 p-4 rounded-2xl border border-white/[0.05]">
                  {character.descriptionAr || character.description}
                </p>
              )}
            </div>

            {/* Right: Portrait Card */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-64 sm:w-72 aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/[0.06] to-black/40 shadow-2xl shadow-cyan-500/10">
                {portraitSrc ? (
                  <>
                    <Image
                      src={sanitizeImg(portraitSrc)}
                      alt={character.name}
                      fill
                      unoptimized={true}
                      className={`object-cover object-top transition-all duration-500 ${
                        isComingSoon
                          ? 'blur-[4px] brightness-40 contrast-125 saturate-50'
                          : 'hover:scale-105'
                      }`}
                      priority
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement
                        if (!img.dataset.failed) {
                          img.dataset.failed = '1'
                          img.src = `/images/characters/${character.slug}.webp`
                        }
                      }}
                    />
                    {isComingSoon && (
                      <div className="absolute inset-0 bg-slate-950/40 flex flex-col items-center justify-center pointer-events-none z-10">
                        <div className="w-14 h-14 rounded-2xl bg-black/80 border border-amber-400/50 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-2xl shadow-black">
                          <Lock size={28} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
                        </div>
                        <span className="mt-3 px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 backdrop-blur-sm">
                          قريباً (مقفل)
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <UserCheck size={64} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {isComingSoon ? (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center" dir="rtl">
          <div className="relative rounded-3xl bg-gradient-to-b from-amber-500/10 via-slate-900 to-[#040812] p-8 sm:p-14 border border-amber-500/25 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-amber-400/20 to-yellow-600/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-xl shadow-amber-500/20">
                <Lock size={38} className="text-amber-400" />
              </div>

              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold bg-amber-400/10 text-amber-300 border border-amber-400/30 mb-4">
                قادمة قريباً {character.releaseVersion ? `• إصدار ${character.releaseVersion}` : ''}
              </span>

              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 font-tajawal">
                دليل {character.nameAr || character.name} قيد التجهيز
              </h2>

              <p className="text-slate-300 max-w-xl mx-auto leading-relaxed mb-8 text-sm sm:text-base">
                ملف هذه الشخصية قيد الإعداد ومقفل حالياً. سيتم فتح شجرة المهارات، وأفضل البيلدات، والأسلحة، والإيكوز، وحسابات الضرر فور نشر الدليل رسمياً من لوحة التحكم.
              </p>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto mb-10 text-right">
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 block mb-1">العنصر</span>
                  <span className="text-sm font-bold text-white">{character.element}</span>
                </div>
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 block mb-1">نوع السلاح</span>
                  <span className="text-sm font-bold text-white">{character.weaponType}</span>
                </div>
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 block mb-1">الندرة</span>
                  <span className="text-sm font-bold text-amber-400">{stars} ★ نجوم</span>
                </div>
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 block mb-1">الإصدار</span>
                  <span className="text-sm font-bold text-cyan-300">{character.releaseVersion || 'قريباً'}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/characters"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm transition-all shadow-lg shadow-cyan-500/20"
                >
                  <span>تصفح الشخصيات المتاحة حالياً</span>
                  <ChevronLeft size={16} />
                </Link>
                <Link
                  href="/tier-list"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all"
                >
                  <span>قائمة تصنيف الشخصيات</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* ─────────────────────────────────────────────────────────────
              STICKY TAB NAVIGATION BAR (ArabWuwa Exact Tabs)
             ───────────────────────────────────────────────────────────── */}
          <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-3 scrollbar-none">
            {[
              { id: 'overview', label: 'النظرة العامة', icon: Activity },
              { id: 'talents', label: `السكلات (${talents.length})`, icon: Zap },
              { id: 'sequences', label: `السيكوينسات (${sequences.length})`, icon: Star },
              { id: 'build', label: 'البيلد والأسلحة', icon: Shield },
              { id: 'teams', label: `التيمات (${teams.length > 0 ? teams.length : 'مقترحة'})`, icon: Users },
              { id: 'calculations', label: 'الحسابات', icon: BarChart3 },
              { id: 'materials', label: 'المواد', icon: Package },
            ].map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                      : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.07] border border-white/[0.05]'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ─────────────────────────────────────────────────────────────
            TAB 1: OVERVIEW & LEVEL SLIDER STATS (النظرة العامة)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white font-tajawal mb-1">الستات الأساسية</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  حرّك مؤشر المستوى لمعاينة إحصائيات الشخصية بدقة من لفل 1 إلى لفل 90
                </p>
              </div>

              {/* Active Level Badge */}
              <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/25 px-4 py-2 rounded-2xl w-fit">
                <span className="text-xs font-semibold text-cyan-400">المستوى المختار:</span>
                <span className="text-lg font-black text-white font-mono">
                  Lv. {currentStat.level}
                </span>
              </div>
            </div>

            {/* Level Slider */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] mb-8">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span>Lv. 1</span>
                <span>Lv. 40</span>
                <span>Lv. 70</span>
                <span className="text-cyan-400 font-bold">Lv. 90 (الماكس)</span>
              </div>

              <input
                type="range"
                min={0}
                max={STAT_LEVELS.length - 1}
                value={levelIndex}
                onChange={(e) => setLevelIndex(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all"
              />

              <div className="flex justify-between mt-3">
                {STAT_LEVELS.map((lvl, idx) => (
                  <button
                    key={lvl}
                    onClick={() => setLevelIndex(idx)}
                    className={`text-[11px] font-mono px-2 py-1 rounded-lg transition-all ${
                      levelIndex === idx
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {[
                { label: 'نقاط الحياة (HP)', val: currentStat.hp, icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                { label: 'الهجوم (ATK)', val: currentStat.atk, icon: Swords, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: 'الدفاع (DEF)', val: currentStat.def, icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'طاقة الريجن (Energy)', val: currentStat.energy, icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                { label: 'الكرت ريت (Crit Rate)', val: currentStat.critRate, icon: Star, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'الكرت دمج (Crit DMG)', val: currentStat.critDmg, icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                { label: 'بونس الشفاء (Healing)', val: currentStat.healing, icon: Activity, color: 'text-teal-400', bg: 'bg-teal-500/10' },
                { label: 'بونس دمج العنصر', val: currentStat.elementDmg, icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div
                    key={s.label}
                    className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-white/20 transition-all flex items-center gap-3.5"
                  >
                    <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={20} className={s.color} />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block leading-tight">
                        {s.label}
                      </span>
                      <span className="text-base sm:text-lg font-black text-white font-mono mt-0.5 block">
                        {s.val}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: TALENTS / SKILLS (السكلات)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'talents' && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white font-tajawal mb-1">شرح السكلات والقدرات</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                تفاصيل كاملة لكل مهارة وقدرة مع وظائفها وتأثيراتها القتالية
              </p>
            </div>

            {talents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {talents.map((t, idx) => (
                  <div
                    key={t.name || idx}
                    className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-start gap-4 mb-3">
                      {t.icon ? (
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-2 shrink-0 relative overflow-hidden">
                          <Image src={sanitizeImg(t.icon)} alt="" fill unoptimized={isDataUrl(t.icon)} className="object-contain p-1" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                          <Zap size={20} className="text-cyan-400" />
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold text-cyan-400 tracking-wide uppercase">
                          {t.category || 'مهارة'}
                        </span>
                        <h3 className="text-lg font-bold text-white font-tajawal">{t.name}</h3>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/[0.05]">
                      {t.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-white/[0.02] rounded-3xl border border-white/[0.06]">
                لا توجد سكلات مسجلة لهذه الشخصية بعد
              </div>
            )}
          </motion.section>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: SEQUENCES S1 - S6 (السيكوينسات)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'sequences' && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white font-tajawal mb-1">سيكوينسات الشخصية (S1 - S6)</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                تقييم قيمة وأهمية كل سيكوينس مع شرح تأثيره في الروتيشن والضرر
              </p>
            </div>

            {sequences.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sequences.map((s, idx) => {
                  const nodeNum = s.node || idx + 1
                  const priority = s.priorityStars || 5
                  return (
                    <div
                      key={s.name || idx}
                      className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] hover:border-amber-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-black font-mono text-amber-400 text-sm">
                            S{nodeNum}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white font-tajawal">{s.name}</h3>
                        </div>

                        {/* Priority Stars */}
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < priority ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/[0.05]">
                        {s.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-white/[0.02] rounded-3xl border border-white/[0.06]">
                لا توجد سيكوينسات مسجلة لهذه الشخصية بعد
              </div>
            )}
          </motion.section>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 4: BUILD, WEAPON COMPARISONS & ECHOES (البيلد والأسلحة)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'build' && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 space-y-10"
          >
            {/* 1. Weapon Comparisons (مقارنة الأسلحة والدمج النسبي) */}
            {weapons.length > 0 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white font-tajawal mb-1">مقارنة الأسلحة: الدمج النسبي</h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    الدمج النسبي للأسلحة مبني على أفضل سيت إيكو مع حساب بافات الروتيشن
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {weapons.map((w, idx) => {
                    const isOpen = !!openWeaponEffect[idx]
                    return (
                      <div
                        key={w.name + idx}
                        className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-black/40 border border-white/[0.08] hover:border-cyan-500/30 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">
                              #{w.rank || idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base font-bold text-white truncate font-mono">
                                {w.name}
                              </h3>
                              <span className="text-xs text-amber-400 font-bold">
                                {w.refinement || 'R1'}
                              </span>
                            </div>
                            <span className="text-lg font-black text-cyan-400 font-mono shrink-0">
                              {w.relativeDps}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mb-4">
                            {w.icon && (
                              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-white/10 p-1 relative overflow-hidden shrink-0">
                                <Image src={sanitizeImg(w.icon)} alt={w.name} fill unoptimized={isDataUrl(w.icon)} className="object-contain" />
                              </div>
                            )}
                            <div className="text-xs space-y-1">
                              {w.statsText && (
                                <p className="text-slate-300 font-mono">{w.statsText}</p>
                              )}
                              {w.avgDamage && (
                                <p className="text-slate-400">
                                  متوسط الدمج: <span className="text-white font-bold font-mono">{w.avgDamage}</span>
                                </p>
                              )}
                              {w.echoStat && (
                                <span className="inline-block px-2 py-0.5 rounded bg-white/[0.05] text-[11px] text-cyan-300 border border-white/[0.05]">
                                  {w.echoStat}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Weapon effect expandable */}
                        {w.effect && (
                          <div className="border-t border-white/[0.06] pt-3">
                            <button
                              type="button"
                              onClick={() => toggleWeaponEffect(idx)}
                              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors py-1"
                            >
                              <span>تأثير السلاح</span>
                              <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpen && (
                              <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-3 rounded-xl mt-2 border border-white/[0.05]">
                                {w.effect}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 2. Echo Sets & Main Echo */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-white font-tajawal mb-1">الماين ستات وأطقم الإيكوز</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  الأطقم الموصى بها والإيكو الرئيسي وأولوية الإحصائيات
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Primary Sonata Set */}
                {echoes?.primarySet && (
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-cyan-500/20">
                    <div className="flex items-center gap-4 mb-4">
                      {echoes.primarySet.icon && (
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 p-2 shrink-0 relative overflow-hidden">
                          <Image src={sanitizeImg(echoes.primarySet.icon)} alt="" fill unoptimized={isDataUrl(echoes.primarySet.icon)} className="object-contain p-1" />
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold text-cyan-400 tracking-wider">طقم الإيكو الأساسي (5 قطع)</span>
                        <h3 className="text-lg font-bold text-white font-tajawal">{echoes.primarySet.name}</h3>
                      </div>
                    </div>
                    {echoes.primarySet.desc && (
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/[0.05]">
                        {echoes.primarySet.desc}
                      </p>
                    )}
                  </div>
                )}

                {/* Main Echo */}
                {echoes?.mainEcho && (
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-amber-500/20">
                    <div className="flex items-center gap-4 mb-4">
                      {echoes.mainEcho.icon && (
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 p-2 shrink-0 relative overflow-hidden">
                          <Image src={sanitizeImg(echoes.mainEcho.icon)} alt="" fill unoptimized={isDataUrl(echoes.mainEcho.icon)} className="object-contain p-1" />
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold text-amber-400 tracking-wider">الإيكو الرئيسي (Main Slot)</span>
                        <h3 className="text-lg font-bold text-white font-tajawal">{echoes.mainEcho.name}</h3>
                      </div>
                    </div>
                    {echoes.mainEcho.desc && (
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/[0.05]">
                        {echoes.mainEcho.desc}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Echo Main Stats Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-5 rounded-2xl bg-black/30 border border-white/[0.06]">
                  <span className="text-xs font-bold text-amber-400 block mb-2">إيكو كوست 4 (Cost 4)</span>
                  <p className="text-sm font-bold text-white">
                    {echoes?.cost4Stats?.join(' أو ') || 'Crit Rate / Crit DMG'}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/30 border border-white/[0.06]">
                  <span className="text-xs font-bold text-cyan-400 block mb-2">إيكو كوست 3 (Cost 3)</span>
                  <p className="text-sm font-bold text-white">
                    {echoes?.cost3Stats?.join(' + ') || `${character.element} DMG Bonus`}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-black/30 border border-white/[0.06]">
                  <span className="text-xs font-bold text-emerald-400 block mb-2">إيكو كوست 1 (Cost 1)</span>
                  <p className="text-sm font-bold text-white">
                    {echoes?.cost1Stats?.join(' + ') || 'ATK% (أتاك)'}
                  </p>
                </div>
              </div>

              {/* Sub-stats Priority */}
              {echoes?.substatsPriority && echoes.substatsPriority.length > 0 && (
                <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08]">
                  <h3 className="text-sm font-bold text-slate-400 mb-3">أولوية السب ستات (Sub-stats Priority)</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {echoes.substatsPriority.map((sub, idx) => (
                      <div key={sub} className="flex items-center gap-2">
                        <span className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 font-bold text-xs border border-cyan-500/20 flex items-center gap-1.5">
                          <span className="text-[10px] text-cyan-500 font-mono">#{idx + 1}</span>
                          <span>{sub}</span>
                        </span>
                        {idx < (echoes.substatsPriority?.length || 0) - 1 && (
                          <ChevronLeft size={16} className="text-slate-600 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 5: TEAMS & ROTATIONS (التيمات مقسمة إلى فرق)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'teams' && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 space-y-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white font-tajawal mb-1">
                تيمات دبس {character.nameAr || character.name} الحالية
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                فرق مقسمة ومعدة للقتال مع تفاصيل الروتيشن لكل شخصية
              </p>
            </div>

            {teams.length > 0 ? (
              <div className="space-y-6">
                {teams.map((team, tIdx) => {
                  const teamKey = team.id || `team-${tIdx}`
                  const isOpen = !!openRotations[teamKey]
                  return (
                    <div
                      key={teamKey}
                      className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.04] to-black/40 border border-white/[0.08] space-y-6"
                    >
                      {/* Team Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs">
                            الترتيب العام #{team.rank || tIdx + 1}
                          </span>
                          <h3 className="text-lg sm:text-xl font-bold text-white font-tajawal">
                            {team.name}
                          </h3>
                        </div>

                        {team.dps && (
                          <div className="text-left sm:text-right">
                            <span className="text-lg sm:text-xl font-black text-cyan-400 font-mono">
                              {team.dps}
                            </span>
                            {team.dpsNote && (
                              <span className="text-xs text-slate-400 block font-sans">
                                {team.dpsNote}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 3 Character Slots */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {(team.members || []).map((member, mIdx) => (
                          <div
                            key={member.name + mIdx}
                            className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center gap-3.5 hover:border-cyan-500/30 transition-all"
                          >
                            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 relative overflow-hidden shrink-0">
                              {member.avatar ? (
                                <Image
                                  src={sanitizeImg(member.avatar)}
                                  alt=""
                                  fill
                                  unoptimized={isDataUrl(member.avatar)}
                                  className="object-cover object-top"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                  <UserCheck size={24} />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-white truncate font-tajawal">
                                {member.name}
                              </h4>
                              {member.role && (
                                <span className="inline-block text-[11px] font-semibold text-cyan-400 mt-0.5">
                                  {member.role}
                                </span>
                              )}
                              {member.weapon && (
                                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                                  {member.weaponIcon && (
                                    <div className="w-4 h-4 relative shrink-0">
                                      <Image src={sanitizeImg(member.weaponIcon)} alt="" fill unoptimized={isDataUrl(member.weaponIcon)} className="object-contain" />
                                    </div>
                                  )}
                                  <span className="truncate">{member.weapon}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Rotations Accordion */}
                      {team.rotations && team.rotations.length > 0 && (
                        <div className="border-t border-white/[0.06] pt-4">
                          <button
                            type="button"
                            onClick={() => toggleRotation(teamKey)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-bold text-slate-300 hover:text-white transition-all"
                          >
                            <span>{isOpen ? 'أغلق روتيشن التيم' : 'عرض روتيشن التيم'}</span>
                            <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isOpen && (
                            <div className="mt-4 space-y-4">
                              {team.rotations.map((rot, rIdx) => (
                                <div
                                  key={rot.title || rIdx}
                                  className="p-4 rounded-2xl bg-black/50 border border-white/[0.05] space-y-3"
                                >
                                  <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                    {rot.title}
                                  </h5>

                                  <div className="space-y-2">
                                    {rot.steps.map((st, sIdx) => (
                                      <div
                                        key={st.characterName + sIdx}
                                        className="text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl"
                                      >
                                        <span className="font-bold text-cyan-300 shrink-0 font-tajawal">
                                          {sIdx + 1}. {st.characterName}:
                                        </span>
                                        <span>{st.action}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-white/[0.02] rounded-3xl border border-white/[0.06]">
                لا توجد فرق وتيمات مسجلة لهذه الشخصية بعد
              </div>
            )}
          </motion.section>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 6: CALCULATIONS & DAMAGE BREAKDOWN (الحسابات)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'calculations' && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white font-tajawal mb-1">الحسابات وتوزيع مصادر الدمج</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                نسبة مساهمة كل ضربة ومهارة في إجمالي ناتج الدمج (DPS Distribution)
              </p>
            </div>

            {damageDist?.segments && damageDist.segments.length > 0 ? (
              <div className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.04] to-black/40 border border-white/[0.08] space-y-6">
                {/* Horizontal Bar Chart */}
                <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-900 border border-white/10">
                  {damageDist.segments.map((seg) => (
                    <div
                      key={seg.key}
                      style={{
                        width: seg.percentage,
                        backgroundColor: seg.color || '#00E5FF'
                      }}
                      title={`${seg.label}: ${seg.percentage}`}
                      className="h-full transition-all hover:opacity-90"
                    />
                  ))}
                </div>

                {/* Legend Items Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {damageDist.segments.map((seg) => (
                    <div
                      key={seg.key}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-md shrink-0"
                          style={{ backgroundColor: seg.color || '#00E5FF' }}
                        />
                        <span className="text-xs font-bold text-white font-tajawal">
                          {seg.label}
                        </span>
                      </div>
                      <span className="text-xs font-black text-cyan-400 font-mono">
                        {seg.percentage}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-white/[0.02] rounded-3xl border border-white/[0.06]">
                لا توجد حسابات أو نسب دمج مسجلة لهذه الشخصية بعد
              </div>
            )}
          </motion.section>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 7: MATERIALS (المواد - 3 مجموعات متكاملة)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === 'materials' && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 space-y-10"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white font-tajawal mb-1">مواد التطوير والترقية</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                الأعداد الدقيقة للمواد المطلوبة لترقية الشخصية وسكلاتها للماكس
              </p>
            </div>

            {/* Section 1: Character Ascension Materials */}
            {ascensionMaterials.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white font-tajawal border-b border-white/[0.06] pb-2">
                  مواد تطوير الشخصية
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {ascensionMaterials.map((m, idx) => (
                    <div
                      key={m.name + idx}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] flex flex-col items-center text-center hover:border-cyan-500/30 transition-all"
                    >
                      {m.icon && (
                        <div className="w-12 h-12 rounded-xl bg-white/[0.04] p-1.5 mb-2 relative overflow-hidden">
                          <Image src={sanitizeImg(m.icon)} alt="" fill unoptimized={isDataUrl(m.icon)} className="object-contain p-1" />
                        </div>
                      )}
                      <span className="text-sm font-black text-white font-mono mb-0.5">{m.amount}</span>
                      <span className="text-[11px] text-slate-400 leading-tight">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: Important Skills Materials */}
            {skillMaterials.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white font-tajawal border-b border-white/[0.06] pb-2">
                  مواد السكلات المهمة
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {skillMaterials.map((m, idx) => (
                    <div
                      key={m.name + idx}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] flex flex-col items-center text-center hover:border-cyan-500/30 transition-all"
                    >
                      {m.icon && (
                        <div className="w-12 h-12 rounded-xl bg-white/[0.04] p-1.5 mb-2 relative overflow-hidden">
                          <Image src={sanitizeImg(m.icon)} alt="" fill unoptimized={isDataUrl(m.icon)} className="object-contain p-1" />
                        </div>
                      )}
                      <span className="text-sm font-black text-white font-mono mb-0.5">{m.amount}</span>
                      <span className="text-[11px] text-slate-400 leading-tight">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: All Materials to Max */}
            {allMaterials.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white font-tajawal border-b border-white/[0.06] pb-2">
                  كل مواد الشخصية والسكلات للماكس
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {allMaterials.map((m, idx) => (
                    <div
                      key={m.name + idx}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] flex flex-col items-center text-center hover:border-cyan-500/30 transition-all"
                    >
                      {m.icon && (
                        <div className="w-12 h-12 rounded-xl bg-white/[0.04] p-1.5 mb-2 relative overflow-hidden">
                          <Image src={sanitizeImg(m.icon)} alt="" fill unoptimized={isDataUrl(m.icon)} className="object-contain p-1" />
                        </div>
                      )}
                      <span className="text-sm font-black text-white font-mono mb-0.5">{m.amount}</span>
                      <span className="text-[11px] text-slate-400 leading-tight">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}
        </div>
      </>
    )}

      {/* ─────────────────────────────────────────────────────────────
          RELATED CHARACTERS
         ───────────────────────────────────────────────────────────── */}
      {safeRelated.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <section className="border-t border-white/[0.06] pt-12 mt-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/20" />
              <h2 className="text-xl font-black text-white shrink-0 font-tajawal">شخصيات مقترحة أخرى</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/20" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {safeRelated.map((char, i) => (
                <CharacterCard key={char.id} character={char} index={i} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
