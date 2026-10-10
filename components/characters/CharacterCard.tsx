'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { BookOpen, Star, FileImage } from 'lucide-react'

interface CharacterCardProps {
  character: {
    id:           string
    name:         string
    slug:         string
    element:      string
    weaponType:   string
    rarity:       string
    portraitPath: string | null
    isPublished:  boolean
    guides?:      Array<{ id: string; title: string; pageCount: number }>
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
          borderColor: 'rgba(255,255,255,0.07)',
        }}
        aria-label={`${character.name}`}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = ELEMENT_BORDER[character.element] || 'rgba(0,200,255,0.35)'
          el.style.boxShadow   = `0 16px 48px rgba(0,0,0,0.7), 0 0 40px ${ELEMENT_GLOW[character.element] || 'rgba(0,200,255,0.12)'}`
          el.style.transform   = 'translateY(-4px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'rgba(255,255,255,0.07)'
          el.style.boxShadow   = ''
          el.style.transform   = ''
        }}
      >
        {/* ── Portrait ── */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#0a1020]">
          {character.portraitPath ? (
            <Image
              src={character.portraitPath}
              alt={character.name}
              fill
              className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#152038] to-[#0a1020]">
              <FileImage size={28} className="text-[#4d6580]" />
            </div>
          )}

          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#080c14] via-[#080c14]/60 to-transparent" />

          {/* Rarity stars — top right */}
          <div className="absolute top-2.5 right-2.5">
            <div className={`flex gap-0.5 ${is5Star ? 'text-[#e8a32e]' : 'text-[#a78bfa]'}`}>
              {Array.from({ length: is5Star ? 5 : 4 }).map((_, i) => (
                <Star key={i} size={9} fill="currentColor" />
              ))}
            </div>
          </div>

          {/* Guide pill — bottom left */}
          {hasGuide && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[rgba(0,200,255,0.18)] border border-[rgba(0,200,255,0.4)] text-[#00c8ff] text-[10px] font-bold">
                <BookOpen size={9} />
                دليل
              </span>
            </div>
          )}

          {/* Shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.025] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
        </div>

        {/* ── Info ── */}
        <div className="p-3 text-right" dir="rtl">
          <h3 className="text-[#eef4ff] font-bold text-sm truncate group-hover:text-[#00c8ff] transition-colors duration-200 mb-1">
            {character.name}
          </h3>
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
