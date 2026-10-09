'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, Calculator } from 'lucide-react'

const FEATURES = [
  'محرر WuwaFlex المدمج بالكامل',
  'محاكاة إحصائيات الشخصية والتحسين',
  'بنيات الصدى وتركيبات الفريق',
  'يعمل على سطح المكتب والهاتف',
]

export default function BuilderFeature() {
  return (
    <section dir="rtl" className="section-gap relative overflow-hidden border-t border-white/[0.04]">
      {/* Background accents */}
      <div
        className="absolute left-0 top-0 w-1/2 h-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at left center, rgba(0,200,255,0.07) 0%, transparent 65%)' }}
      />
      <div
        className="absolute right-0 bottom-0 w-1/3 h-1/2 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at right bottom, rgba(124,58,237,0.08) 0%, transparent 65%)' }}
      />

      <div className="container-main relative">
        <div className="grid md:grid-cols-2 gap-14 md:gap-20 items-center">

          {/* ── Text column ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-0.5 bg-[#00c8ff]" />
              <span className="text-[#00c8ff] text-xs font-bold tracking-[0.2em] uppercase">
                محرر البناء
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-5 leading-tight">
              ابنِ بناءك مع{' '}
              <span className="text-gradient-cyan">WuwaFlex</span>
            </h2>

            <p className="text-[#8fa8c4] text-base leading-relaxed mb-8 max-w-md">
              استخدم محرر WuwaFlex الأصلي المدمج مباشرةً في موقعنا.
              جرّب البنيات وحسّن الإحصائيات وصمّم فريقك — كل ذلك دون مغادرة هذه الصفحة.
            </p>

            <ul className="space-y-3.5 mb-10">
              {FEATURES.map(item => (
                <li key={item} className="flex items-center gap-3 text-[#8fa8c4] text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00c8ff] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/builder" className="btn btn-primary px-8 py-3.5 text-sm font-bold">
                <Calculator size={17} />
                تشغيل محاكي WuwaFlex
              </Link>
            </div>
          </motion.div>

          {/* ── Visual mockup ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            {/* Browser mockup */}
            <div
              className="relative rounded-2xl overflow-hidden border border-white/[0.08]"
              style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(0,200,255,0.08)' }}
            >
              {/* Window chrome */}
              <div className="h-10 bg-[#0a1020] border-b border-white/[0.07] flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  {['#ff5f57','#febc2e','#28c840'].map(c => (
                    <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex-1 mx-4 h-5 bg-[#060a14] rounded-md border border-white/[0.06] flex items-center px-3">
                  <span className="text-[#4d6580] text-[10px] font-mono">wuwaflex.com/builder</span>
                </div>
              </div>

              {/* Content area */}
              <div className="bg-[#060a14] p-6 h-56 flex flex-col gap-3 relative overflow-hidden">
                {/* Ambient glow */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 80%, rgba(0,200,255,0.06) 0%, transparent 70%)' }}
                />

                {/* Fake stats bars */}
                {[
                  { label: 'ATK',  pct: 78, color: '#00c8ff' },
                  { label: 'DEF',  pct: 52, color: '#a78bfa' },
                  { label: 'CRIT', pct: 65, color: '#e8a32e' },
                  { label: 'SPD',  pct: 90, color: '#38bdf8' },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <span className="text-[#4d6580] text-xs w-10 latin">{stat.label}</span>
                    <div className="flex-1 h-1.5 bg-[#0f1829] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: stat.color, boxShadow: `0 0 8px ${stat.color}` }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${stat.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.22,1,0.36,1] }}
                      />
                    </div>
                    <span className="text-[#8fa8c4] text-xs w-8 text-left latin">{stat.pct}%</span>
                  </div>
                ))}

                <div className="mt-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(0,200,255,0.1)] border border-[rgba(0,200,255,0.3)] text-[#00c8ff] text-xs font-bold">
                    <Zap size={12} fill="currentColor" />
                    WuwaFlex Engine
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div
              className="absolute -bottom-4 -right-4 px-4 py-2.5 rounded-xl border border-[rgba(0,200,255,0.3)] text-sm font-bold text-[#00c8ff]"
              style={{ background: 'rgba(0,200,255,0.1)', backdropFilter: 'blur(12px)' }}
            >
              <Zap size={14} className="inline ml-1" fill="currentColor" />
              مباشر ومدمج
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
