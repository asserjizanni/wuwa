'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight, Star, BookOpen, ExternalLink, FileImage, Play
} from 'lucide-react'
import ElementBadge from '@/components/ui/ElementBadge'
import WeaponBadge from '@/components/ui/WeaponBadge'
import CharacterCard from '@/components/characters/CharacterCard'
import GuideViewer from '@/components/guide/GuideViewer'
import { formatDate, rarityToStars } from '@/lib/utils'

interface GuidePageData {
  id: string
  pageNumber: number
  imagePath: string
  thumbnailPath: string | null
  width: number | null
  height: number | null
}

interface GuideData {
  id: string
  title: string
  version: number
  pageCount: number
  publishedAt: string | null
  pages: GuidePageData[]
}

interface CharacterData {
  id: string
  name: string
  slug: string
  element: string
  weaponType: string
  rarity: string
  portraitPath: string | null
  backgroundPath: string | null
  description: string | null
  guides: GuideData[]
}

interface Props {
  character: CharacterData
  relatedCharacters: any[]
}

export default function CharacterDetailClient({ character, relatedCharacters }: Props) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const activeGuide = character.guides[0] || null
  const stars = rarityToStars(character.rarity)
  const isS5 = stars === 5

  return (
    <div className="min-h-screen pt-16" dir="rtl">

      {/* ── Full-bleed atmospheric background ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Deep base */}
        <div className="absolute inset-0 bg-[#030508]" />

        {/* Character art bleed - extra dark */}
        {character.backgroundPath && (
          <Image
            src={character.backgroundPath}
            alt=""
            fill
            className="object-cover object-center"
            style={{ opacity: 0.04, filter: 'blur(2px) saturate(140%)' }}
            priority
          />
        )}

        {/* Gradient veil */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              'linear-gradient(to bottom, rgba(3,5,8,0.7) 0%, rgba(3,5,8,0.4) 30%, rgba(3,5,8,0.85) 70%, #030508 100%)',
              isS5
                ? 'radial-gradient(ellipse 65% 55% at 50% 0%, rgba(232,163,46,0.08) 0%, transparent 65%)'
                : 'radial-gradient(ellipse 65% 55% at 50% 0%, rgba(0,200,255,0.07) 0%, transparent 65%)',
            ].join(', '),
          }}
        />
      </div>

      {/* ─────────────────────────────────────
          HERO — Character Profile
          ───────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">

        {/* Wide portrait art (decorative) */}
        {character.portraitPath && (
          <div
            className="absolute top-0 left-0 h-full w-[45%] pointer-events-none"
            style={{ opacity: 0.12 }}
            aria-hidden
          >
            <Image
              src={character.portraitPath}
              alt=""
              fill
              className="object-cover object-top"
              style={{ filter: 'blur(4px) saturate(150%)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#030508]" />
          </div>
        )}

        <div className="container-main py-16 md:py-24">
          {/* Breadcrumb */}
          <Link
            href="/characters"
            className="inline-flex items-center gap-2 text-sm text-[#8fa8c4] hover:text-white mb-10 transition-colors group"
          >
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            جميع الشخصيات
          </Link>

          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">

            {/* Portrait card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative shrink-0 rounded-3xl overflow-hidden"
              style={{
                width:  220,
                height: 295,
                boxShadow: isS5
                  ? '0 0 0 1px rgba(232,163,46,0.3), 0 24px 64px rgba(0,0,0,0.8), 0 0 80px rgba(232,163,46,0.12)'
                  : '0 0 0 1px rgba(0,200,255,0.2), 0 24px 64px rgba(0,0,0,0.8), 0 0 60px rgba(0,200,255,0.08)',
              }}
            >
              {character.portraitPath ? (
                <Image
                  src={character.portraitPath}
                  alt={character.name}
                  fill
                  className="object-cover object-top"
                  priority
                  sizes="220px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0f1829]">
                  <FileImage size={48} className="text-[#4d6580]" />
                </div>
              )}

              {/* Bottom gradient */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

              {/* Rarity stars */}
              <div className={`absolute bottom-3 inset-x-0 flex justify-center gap-0.5 ${isS5 ? 'text-[#e8a32e]' : 'text-[#a78bfa]'}`}>
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={12} fill="currentColor" />
                ))}
              </div>
            </motion.div>

            {/* Info panel */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 pt-2"
            >
              {/* Element + weapon */}
              <div className="flex flex-wrap gap-2 mb-4">
                <ElementBadge element={character.element} />
                <WeaponBadge weaponType={character.weaponType} />
              </div>

              {/* Name */}
              <h1
                className="text-5xl md:text-6xl xl:text-7xl font-black leading-[1.1] mb-5"
                style={{
                  backgroundImage: isS5
                    ? 'linear-gradient(135deg, #fff 30%, #ffd97a 100%)'
                    : 'linear-gradient(135deg, #fff 30%, #7bdfff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {character.name}
              </h1>

              {/* Description */}
              {character.description && (
                <p className="text-[#8fa8c4] text-base md:text-lg leading-relaxed mb-8 max-w-xl">
                  {character.description}
                </p>
              )}

              {/* Guide CTA */}
              {activeGuide ? (
                <div className="flex flex-wrap gap-3">
                  <motion.button
                    onClick={() => setViewerOpen(true)}
                    id="open-guide-btn"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`btn text-base px-8 py-4 ${isS5 ? 'btn-gold' : 'btn-primary'}`}
                  >
                    <Play size={18} fill="currentColor" />
                    دليل الشخصية
                    <span className="opacity-75 text-sm mr-1">({activeGuide.pageCount} صفحة)</span>
                  </motion.button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl border border-white/10 text-[#8fa8c4] text-sm bg-white/[0.03]">
                  <BookOpen size={16} className="text-[#4d6580]" />
                  لم يُضف دليل لهذه الشخصية بعد
                </div>
              )}

              {/* Published date */}
              {activeGuide?.publishedAt && (
                <p className="text-[#4d6580] text-xs mt-4">
                  آخر تحديث: {formatDate(activeGuide.publishedAt)}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────
          GUIDE PREVIEW GALLERY
          ───────────────────────────────────── */}
      {activeGuide && activeGuide.pages.length > 0 && (
        <section className="container-main py-16">

          {/* Section header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-6 h-0.5 bg-[#00c8ff]" />
                <span className="text-[#00c8ff] text-xs font-bold uppercase tracking-wider">الصور</span>
              </div>
              <h2 className="text-2xl font-black text-white">{activeGuide.title}</h2>
              <p className="text-[#8fa8c4] text-sm mt-1">
                {activeGuide.pageCount} صفحة
                {activeGuide.publishedAt && ` · ${formatDate(activeGuide.publishedAt)}`}
              </p>
            </div>
            <motion.button
              onClick={() => setViewerOpen(true)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="btn btn-outline text-sm py-2.5 px-5"
            >
              عرض التفاصيل
              <ExternalLink size={14} />
            </motion.button>
          </div>

          {/* Page grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {activeGuide.pages.slice(0, 6).map((page, i) => (
              <motion.button
                key={page.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setViewerOpen(true)}
                aria-label={`عرض الصفحة ${page.pageNumber}`}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/[0.07] hover:border-[rgba(0,200,255,0.35)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(0,200,255,0.1)]"
              >
                <div className="absolute inset-0 bg-[#0f1829]" />
                {(page.thumbnailPath || page.imagePath) && (
                  <Image
                    src={page.thumbnailPath ?? page.imagePath}
                    alt={`صفحة ${page.pageNumber}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="200px"
                    loading="lazy"
                  />
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <Play
                    size={28}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    fill="currentColor"
                  />
                </div>

                {/* Page number pill */}
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {page.pageNumber}
                </div>
              </motion.button>
            ))}

            {/* More pages card */}
            {activeGuide.pages.length > 6 && (
              <motion.button
                onClick={() => setViewerOpen(true)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="aspect-[3/4] rounded-2xl border border-dashed border-[rgba(0,200,255,0.25)] flex flex-col items-center justify-center gap-2 text-[#8fa8c4] hover:text-[#00c8ff] hover:border-[rgba(0,200,255,0.5)] hover:bg-[rgba(0,200,255,0.04)] transition-all duration-300"
              >
                <span className="text-3xl font-black text-gradient-cyan latin">+{activeGuide.pages.length - 6}</span>
                <span className="text-xs">صفحة إضافية</span>
              </motion.button>
            )}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────
          RELATED CHARACTERS
          ───────────────────────────────────── */}
      {relatedCharacters.length > 0 && (
        <section className="border-t border-white/[0.05]">
          <div className="container-main py-16">

            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[rgba(0,200,255,0.25)]" />
              <h2 className="text-xl font-black text-white shrink-0">شخصيات مشابهة</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[rgba(0,200,255,0.25)]" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedCharacters.map((char, i) => (
                <CharacterCard key={char.id} character={char} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Guide Viewer Modal ── */}
      {activeGuide && (
        <GuideViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          pages={activeGuide.pages}
          title={activeGuide.title}
          characterName={character.name}
        />
      )}
    </div>
  )
}
