'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { BookOpen, Star, Lock } from 'lucide-react'

interface CharacterCardProps {
  character: {
    id:              string
    name:            string
    nameAr?:         string | null
    slug:            string
    element:         string
    weaponType:      string
    rarity:          string
    portraitPath:    string | null
    isPublished?:    boolean
    isComingSoon?:   boolean
    releaseVersion?: string | null
    guides?:         Array<{ id: string; title: string; pageCount: number }>
  }
  index?:   number
  variant?: 'default' | 'compact'
}

const ELEMENT_GLOW: Record<string, string> = {
  AERO:    'rgba(56,189,248,0.25)',
  SPECTRO: 'rgba(251,191,36,0.25)',
  FUSION:  'rgba(239,68,68,0.25)',
  ELECTRO: 'rgba(168,85,247,0.25)',
  GLACIO:  'rgba(147,197,253,0.25)',
  HAVOC:   'rgba(107,33,168,0.3)',
}

const ELEMENT_BORDER: Record<string, string> = {
  AERO:    'rgba(56,189,248,0.35)',
  SPECTRO: 'rgba(251,191,36,0.35)',
  FUSION:  'rgba(239,68,68,0.35)',
  ELECTRO: 'rgba(168,85,247,0.35)',
  GLACIO:  'rgba(147,197,253,0.35)',
  HAVOC:   'rgba(124,58,237,0.4)',
}

const ELEMENT_AR: Record<string, string> = {
  AERO:    'Aero',
  SPECTRO: 'Spectro',
  FUSION:  'Fusion',
  ELECTRO: 'Electro',
  GLACIO:  'Glacio',
  HAVOC:   'Havoc',
}

const WEAPON_AR: Record<string, string> = {
  BROADBLADE:  'سيف عريض',
  SWORD:       'سيف',
  PISTOLS:     'مسدسان',
  GAUNTLETS:   'قفازات',
  RECTIFIER:   'مُصحِّح',
}

export default function CharacterCard({ character, index = 0 }: CharacterCardProps) {
  const hasGuide = character.guides && character.guides.length > 0
  const is5Star  = character.rarity === 'FIVE_STAR'
  const isComingSoon = !!(character.isComingSoon || character.isPublished === false)
  const displayName = character.nameAr || character.name

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={{
        duration: 0.45,
        delay:    Math.min(index * 0.04, 0.6),
        ease:     [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        href={`/characters/${character.slug}`}
        className="group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-350"
        style={{
          background:  'linear-gradient(180deg, #0f1829 0%, #080c14 100%)',
          borderColor: isComingSoon ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)',
        }}
        aria-label={displayName}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = isComingSoon ? 'rgba(245,158,11,0.6)' : (ELEMENT_BORDER[character.element] || 'rgba(0,200,255,0.35)')
          el.style.boxShadow   = isComingSoon
            ? '0 16px 48px rgba(0,0,0,0.8), 0 0 30px rgba(245,158,11,0.2)'
            : `0 16px 48px rgba(0,0,0,0.7), 0 0 40px ${ELEMENT_GLOW[character.element] || 'rgba(0,200,255,0.12)'}`
          el.style.transform   = 'translateY(-4px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = isComingSoon ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)'
          el.style.boxShadow   = ''
          el.style.transform   = ''
        }}
      >
        {/* ── Portrait ── */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#0a1020]">
          {(() => {
            const imgSrc = (character.portraitPath && !character.portraitPath.startsWith('data:'))
              ? character.portraitPath
              : `/images/characters/${character.slug}.webp`

            return (
              <Image
                src={imgSrc}
                alt={displayName}
                fill
                unoptimized={imgSrc.startsWith('data:')}
                className={`object-cover object-top transition-all duration-500 ${
                  isComingSoon
                    ? 'blur-[3px] brightness-40 contrast-125 saturate-50 group-hover:blur-[1px] group-hover:brightness-60 group-hover:scale-105'
                    : 'group-hover:scale-105'
                }`}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
              />
            )
          })()}

          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#080c14] via-[#080c14]/70 to-transparent" />

          {/* Dark mystery overlay for coming soon */}
          {isComingSoon && (
            <div className="absolute inset-0 bg-slate-950/40 pointer-events-none transition-opacity duration-300 group-hover:bg-slate-950/20" />
          )}

          {/* Center mystery lock for coming soon */}
          {isComingSoon && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 transition-transform duration-300 group-hover:scale-110">
              <div className="w-11 h-11 rounded-2xl bg-black/75 border border-amber-400/40 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-xl shadow-black/80">
                <Lock size={20} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              </div>
            </div>
          )}

          {/* Coming Soon badge — top right (RTL view) */}
          {isComingSoon ? (
            <div className="absolute top-2.5 right-2.5 z-10">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-black/85 text-amber-300 border border-amber-400/50 backdrop-blur-md shadow-lg shadow-black/60">
                <Lock size={10} className="text-amber-400" />
                قريباً
              </span>
            </div>
          ) : (
            /* Rarity stars — top right */
            <div className="absolute top-2.5 right-2.5">
              <div className={`flex gap-0.5 ${is5Star ? 'text-[#e8a32e]' : 'text-[#a78bfa]'}`}>
                {Array.from({ length: is5Star ? 5 : 4 }).map((_, i) => (
                  <Star key={i} size={9} fill="currentColor" />
                ))}
              </div>
            </div>
          )}

          {/* Version badge or Guide pill — bottom left */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 z-10">
            {character.releaseVersion && (
              <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold backdrop-blur-sm">
                {character.releaseVersion}
              </span>
            )}
            {hasGuide && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[rgba(0,200,255,0.18)] border border-[rgba(0,200,255,0.4)] text-[#00c8ff] text-[10px] font-bold">
                <BookOpen size={9} />
                دليل
              </span>
            )}
          </div>

          {/* Shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.025] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
        </div>

        {/* ── Info ── */}
        <div className="p-3 text-right" dir="rtl">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[#eef4ff] font-bold text-sm truncate group-hover:text-[#00c8ff] transition-colors duration-200">
              {displayName}
            </h3>
            {isComingSoon && (
              <span className="text-[10px] font-medium text-amber-400/90 bg-amber-400/10 px-1.5 py-0.5 rounded">
                مقفل
              </span>
            )}
          </div>
          <p className="text-[#8fa8c4] text-[11px] font-medium flex items-center justify-between">
            <span>{ELEMENT_AR[character.element] || character.element}</span>
            <span className="opacity-40">·</span>
            <span>{WEAPON_AR[character.weaponType] || character.weaponType}</span>
          </p>
        </div>
      </Link>
    </motion.div>
  )
}
