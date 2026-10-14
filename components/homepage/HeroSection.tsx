'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Users, Zap, Sparkles, Shield, ChevronDown } from 'lucide-react'

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: (((i * 41) % 100)).toString() + '%',
  delay: (i * 0.9) % 7,
  duration: 8 + (i % 5) * 2,
  size: 2 + (i % 3) * 1.5,
  opacity: 0.25 + (i % 4) * 0.15,
  color: i % 2 === 0 ? '#00c8ff' : '#a78bfa',
}))

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section
      ref={ref}
      dir="rtl"
      className="relative min-h-[92vh] lg:min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16"
      aria-label="الرئيسية"
    >
      {/* ── Deep Background & Cinematic Vignette ── */}
      <div className="absolute inset-0 bg-[#030508]" />

      {/* Atmospheric Radial Lights (Cyan & Violet) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 70% 50% at 75% 45%, rgba(0,200,255,0.12) 0%, transparent 65%)',
            'radial-gradient(ellipse 60% 45% at 25% 65%, rgba(124,58,237,0.10) 0%, transparent 60%)',
            'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(56,189,248,0.08) 0%, transparent 65%)',
          ].join(', '),
        }}
      />

      {/* Subtle Resonance Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,200,255,0.7) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,200,255,0.7) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Floating Ambient Resonance Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.left,
              bottom: '-10px',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 10px ${p.color}`,
            }}
            animate={{ y: [0, -950], opacity: [0, p.opacity, p.opacity, 0] }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* ── Main Hero Composition ── */}
      <motion.div
        style={{ y, opacity }}
        className="container-main relative z-10 w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Column (Content & CTAs) */}
          <div className="lg:col-span-7 text-right space-y-6">

            {/* Community & Branding Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,200,255,0.15)]"
            >
              <span className="w-2 h-2 rounded-full bg-[#00c8ff] animate-pulse shadow-[0_0_8px_#00c8ff]" />
              <span className="text-white text-xs font-black tracking-wide">
                وذرينق ويفز العربية
              </span>
              <span className="text-[#4d6580] text-xs">·</span>
              <span className="text-[#00c8ff] text-xs font-bold font-mono">
                Wuthering Waves Builds
              </span>
            </motion.div>

            {/* Primary Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black leading-[1.12] tracking-tight text-white"
            >
              <span className="block text-gradient-white">دليل الشخصيات</span>
              <span className="block mt-2 text-gradient-cyan">واحتراف البِلدات</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-[#8fa8c4] text-base sm:text-lg max-w-xl leading-relaxed"
            >
              المرجع المجتمعي الشامل لاستعراض أفضل بنيات <span className="text-white font-bold">Resonators</span> و <span className="text-white font-bold">Echo Builds</span> في <span className="text-white font-bold">Wuthering Waves</span>، مع محاكي <span className="text-[#00c8ff] font-bold">WuwaFlex</span> المدمج.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                href="/characters"
                id="hero-explore-btn"
                className="btn btn-primary text-base px-8 py-3.5 shadow-[0_0_30px_rgba(0,200,255,0.35)]"
              >
                <Users size={18} />
                <span>استعرض الشخصيات</span>
              </Link>

              <Link
                href="/spin"
                id="hero-spin-btn"
                className="btn btn-outline text-base px-6 py-3.5 border-violet-500/40 hover:border-violet-400 bg-violet-950/20 text-violet-200 hover:text-white shadow-[0_0_20px_rgba(167,139,250,0.15)] hover:shadow-[0_0_25px_rgba(167,139,250,0.3)] transition-all flex items-center gap-2"
              >
                <Sparkles size={18} className="text-[#a78bfa] animate-pulse" />
                <span>عجلة الحظ</span>
              </Link>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="pt-6 border-t border-white/[0.07] grid grid-cols-3 gap-4 max-w-lg"
            >
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white latin tracking-tight">35+</p>
                <p className="text-xs text-[#8fa8c4] mt-0.5">الشخصيات</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-[#00c8ff] latin tracking-tight">6</p>
                <p className="text-xs text-[#8fa8c4] mt-0.5">Elements</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-[#e8a32e] latin tracking-tight">5</p>
                <p className="text-xs text-[#8fa8c4] mt-0.5">أنواع الأسلحة</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column (Hero Character Artwork Focal Point) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative flex justify-center lg:justify-end"
          >
            {/* Glowing Backdrop Circle */}
            <div className="absolute -inset-4 sm:-inset-8 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-violet-600/15 to-transparent blur-3xl -z-10 pointer-events-none" />

            {/* Character Artwork Frame */}
            <div className="relative w-full max-w-md aspect-[3/4.2] rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(0,200,255,0.15)] group">
              <Image
                src="/carthi.png"
                alt="Carthi - Wuthering Waves"
                fill
                className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                priority
                sizes="(max-width: 1024px) 100vw, 440px"
              />

              {/* Bottom cinematic gradient fade */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#030508] via-[#030508]/60 to-transparent" />

              {/* Character Glass Tag */}
              <div className="absolute bottom-5 inset-x-5 p-3.5 rounded-2xl bg-[#040812]/85 backdrop-blur-xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
                    <Sparkles size={18} className="text-[#00c8ff]" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-black">Wuthering Waves</p>
                    <p className="text-[10px] text-[#00c8ff] font-semibold">بناء وتطوير الشخصيات</p>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-cyan-300/90 font-mono tracking-wide">
                  Carthi
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* Scroll Down Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[#4d6580]"
      >
        <span className="text-[10px] uppercase tracking-widest font-semibold">تصفح المزيد</span>
        <ChevronDown size={16} className="animate-bounce text-[#00c8ff]" />
      </motion.div>
    </section>
  )
}
