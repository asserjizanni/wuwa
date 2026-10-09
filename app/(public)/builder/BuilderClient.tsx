'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, RefreshCw, Cpu } from 'lucide-react'

const BUILDER_URL = 'https://wuwaflex.com/builder'

export default function BuilderClient() {
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(false)
  const [retries, setRetries]       = useState(0)
  const iframeRef                   = useRef<HTMLIFrameElement>(null)
  const loadTimerRef                = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    loadTimerRef.current = setTimeout(() => {
      if (loading) {
        setLoading(false) // Optimistically display iframe
      }
    }, 8000)

    return () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current)
    }
  }, [retries, loading])

  const handleLoad = () => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current)
    setLoading(false)
    setError(false)
  }

  const handleError = () => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current)
    setLoading(false)
    setError(true)
  }

  const handleRetry = () => {
    setLoading(true)
    setError(false)
    setRetries(r => r + 1)
    if (iframeRef.current) {
      iframeRef.current.src = BUILDER_URL
    }
  }

  return (
    <div className="flex flex-col min-h-screen pt-[68px]" dir="rtl">
      {/* Top Header bar */}
      <div
        className="border-b border-white/[0.08] px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20"
        style={{ background: 'rgba(8,12,20,0.95)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00c8ff]/10 border border-[#00c8ff]/30 flex items-center justify-center text-[#00c8ff]">
            <Cpu size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white text-base font-bold">محرر وباني الشخصيات WuwaFlex</h1>
              <span className="badge badge-cyan text-[11px] py-0 px-2 font-mono">مدمج</span>
            </div>
            <p className="text-[#4d6580] text-xs">
              مدعوم بواسطة{' '}
              <a
                href="https://wuwaflex.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00c8ff] hover:underline"
              >
                wuwaflex.com
              </a>
              {' '}— محاكي إحصائيات وأطقم صدى متكامل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 text-xs text-[#8fa8c4] hover:text-white px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>إعادة التحميل</span>
          </button>
        </div>
      </div>

      {/* Builder container */}
      <div className="relative flex-1 bg-[#030508] overflow-hidden flex flex-col">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#030508]/95 backdrop-blur-md">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#00c8ff]/10 border border-[#00c8ff]/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,200,255,0.2)]">
                <Loader2 size={28} className="text-[#00c8ff] animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base">جارٍ تحميل المحتوى...</p>
              <p className="text-[#8fa8c4] text-xs mt-1">محاكي WuwaFlex المدمج</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#030508] px-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertCircle size={32} />
            </div>
            <div className="text-center max-w-md">
              <h3 className="text-white font-bold text-lg mb-2">تعذّر تحميل المحتوى. حاول مرة أخرى.</h3>
              <p className="text-[#8fa8c4] text-sm leading-relaxed mb-6">
                يرجى التحقق من اتصال الإنترنت والضغط على إعادة المحاولة لتحديث أداة البناء.
              </p>
              <div className="flex justify-center">
                <button onClick={handleRetry} className="btn btn-primary text-sm px-6 py-2.5">
                  <RefreshCw size={15} />
                  إعادة المحاولة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          ref={iframeRef}
          key={retries}
          src={BUILDER_URL}
          title="WuwaFlex Character Build Builder"
          className={`w-full border-none block transition-opacity duration-500 ${loading || error ? 'opacity-0' : 'opacity-100'}`}
          style={{ minHeight: 'calc(100vh - 128px)', height: '100%' }}
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={handleLoad}
          onError={handleError}
          allowFullScreen
        />
      </div>
    </div>
  )
}
