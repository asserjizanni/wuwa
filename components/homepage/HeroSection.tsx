'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Users, Zap, ArrowLeft, Star } from 'lucide-react'

/* ── Random seeded particles (SSR safe) ── */
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left:     (((i * 37) % 100)).toString() + '%',
  delay:    (i * 1.1) % 9,
  duration: 10 + (i % 6) * 1.5,
  size:     1.5 + (i % 3) * 1.2,
  opacity:  0.3 + (i % 4) * 0.1,
}))

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y       = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section
      ref={ref}
      dir="rtl"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      aria-label="الرئيسية"
    >
      {/* ── Deep background ── */}
      <div className="absolute inset-0 bg-[#030508]" />

      {/* ── Radial ambient — top center ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 75% 55% at 50% -5%, rgba(0,200,255,0.09) 0%, transparent 65%)',
            'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(232,163,46,0.06) 0%, transparent 65%)',
            'radial-gradient(ellipse 50% 40% at 20% 90%, rgba(124,58,237,0.07) 0%, transparent 60%)',
          ].join(', '),
        }}
      />

      {/* ── Animated grid ── */}
      <div
        className="absolute inset-0 opacity-[0.028] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,200,255,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,200,255,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px',
        }}
      />

      {/* ── Horizontal scan line ── */}
      <div
        className="absolute inset-x-0 h-px opacity-20 pointer-events-none"
        style={{
          top: '40%',
          background: 'linear-gradient(to left, transparent 0%, rgba(0,200,255,0.6) 30%, rgba(0,200,255,1) 50%, rgba(0,200,255,0.6) 70%, transparent 100%)',
          boxShadow: '0 0 30px rgba(0,200,255,0.4)',
        }}
      />

      {/* ── Floating particles ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-[#00c8ff]"
            style={{
              left:   p.left,
              bottom: '-10px',
              width:  p.size,
              height: p.size,
            }}
            animate={{ y: [0, -1100], opacity: [0, p.opacity, p.opacity, 0] }}
            transition={{
              duration:  p.duration,
              delay:     p.delay,
              repeat:    Infinity,
              ease:      'linear',
            }}
          />
        ))}
      </div>

      {/* ── Main content ── */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 text-center px-6 py-36 max-w-6xl mx-auto w-full"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-[rgba(0,200,255,0.3)] bg-[rgba(0,200,255,0.07)] mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00c8ff] animate-pulse" />
          <span className="text-[#00c8ff] text-xs font-bold tracking-[0.2em] uppercase">
            أدلة البناء الاحترافية
          </span>
        </motion.div>

        {/* ── Headline ── */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl xl:text-[96px] font-black leading-[1.1] mb-6 tracking-tight"
        >
          <span className="text-gradient-white block">احترف بناء</span>
          <span className="text-gradient-cyan block mt-1">الشخصيات</span>
        </motion.h1>

        {/* ── Sub-headline ── */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-[#8fa8c4] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-4"
        >
          مركز{' '}
          <span className="text-white font-semibold">Wuthering Waves</span>
          {' '}الشامل — تصفح أدلة البناء الاحترافية وشاهد مستندات PDF
          واستخدم محرر WuwaFlex المدمج.
        </motion.p>

        {/* ── Gold note ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-[#e8a32e] text-sm font-semibold mb-12"
        >
          ★ أدلة وبنيات احترافية · محرر WuwaFlex المدمج · 6 عناصر قتالية
        </motion.p>

        {/* ── CTAs ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/characters"
            id="hero-explore-btn"
            className="btn btn-primary text-base px-8 py-4"
          >
            <Users size={18} />
            استعرض الشخصيات
          </Link>
          <Link
            href="/builder"
            id="hero-builder-btn"
            className="btn btn-outline text-base px-8 py-4"
          >
            <Zap size={18} />
            محرر WuwaFlex
          </Link>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="mt-20 flex items-center justify-center gap-px flex-wrap"
        >
          {[
            { value: '35+', label: 'شخصية' },
            { value: '6',   label: 'عناصر' },
            { value: '5',   label: 'أنواع أسلحة' },
          ].map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col items-center px-10 py-3"
              style={{
                borderRight: i > 0 ? '1px solid rgba(255,255,255,0.08)' : undefined,
              }}
            >
              <span className="text-3xl font-black text-gradient-cyan latin">{s.value}</span>
              <span className="text-xs text-[#4d6580] uppercase tracking-[0.12em] mt-1">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] text-[#4d6580] tracking-[0.2em] uppercase">مرر للأسفل</span>
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="w-5 h-8 rounded-full border border-[rgba(255,255,255,0.12)] flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-[#00c8ff]" />
        </motion.div>
      </motion.div>
    </section>
  )
}
