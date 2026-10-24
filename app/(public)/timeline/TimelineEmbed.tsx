'use client'

import { useState } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'

// Height to clip: WuWa Tracker navbar (64px) + Daily/Weekly Reset bar (36px) = 100px
const CLIP_TOP = 100
// Visible height of the embed window
const EMBED_HEIGHT = 820

export default function TimelineEmbed() {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [key, setKey] = useState(0)

  return (
    <div className="w-full bg-[#030508] pb-12">
      {/* 
        Container with fixed visible height:
        - Clips top 100px (removes tracker nav, logo, daily/weekly reset timers)
        - Shows full timeline table with active events
        - Sized so modal dialogs are centered directly on screen without clipping
      */}
      <div
        dir="ltr"
        className="relative w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#030508]"
        style={{
          height: `${EMBED_HEIGHT}px`,
        }}
      >
        {/* Loading Skeleton */}
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#030508] z-20 pointer-events-none">
            <div className="w-12 h-12 rounded-full border-2 border-[#00c8ff]/30 border-t-[#00c8ff] animate-spin" />
            <p className="text-slate-400 text-sm font-medium">جاري تحميل الجدول الزمني…</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#030508] z-20 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <ExternalLink size={28} className="text-red-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg mb-1">تعذّر تحميل الجدول الزمني</p>
              <p className="text-slate-400 text-sm max-w-sm">
                قد يكون ذلك بسبب إعدادات الشبكة أو المتصفح.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setError(false)
                  setLoaded(false)
                  setKey((k) => k + 1)
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-all"
              >
                <RefreshCw size={15} />
                إعادة المحاولة
              </button>
              <a
                href="https://wuwatracker.com/timeline"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c8ff] hover:bg-[#00b0e0] text-black text-sm font-bold transition-all"
              >
                <ExternalLink size={15} />
                فتح في WuWa Tracker
              </a>
            </div>
          </div>
        )}

        {/* 
          Iframe:
          - Sized in explicit pixels so it never collapses
          - marginTop: -100px clips out header + Daily/Weekly reset
          - Allows scrolling & clicking events naturally
        */}
        <iframe
          key={key}
          src="https://wuwatracker.com/timeline"
          title="Wuthering Waves Event Timeline"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className="w-full border-0 block"
          style={{
            width: '100%',
            height: `${EMBED_HEIGHT + CLIP_TOP}px`,
            marginTop: `-${CLIP_TOP}px`,
            backgroundColor: '#030508',
          }}
          loading="eager"
          allow="clipboard-read; clipboard-write; fullscreen"
        />
      </div>
    </div>
  )
}
