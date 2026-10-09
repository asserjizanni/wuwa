'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Maximize2, LayoutGrid, Loader2, AlertCircle
} from 'lucide-react'

interface GuidePage {
  id: string
  pageNumber: number
  imagePath: string
  thumbnailPath: string | null
  width: number | null
  height: number | null
}

interface GuideViewerProps {
  isOpen: boolean
  onClose: () => void
  pages: GuidePage[]
  title: string
  characterName: string
}

export default function GuideViewer({
  isOpen, onClose, pages, title, characterName
}: GuideViewerProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [mode, setMode] = useState<'single' | 'grid'>('single')
  const [zoom, setZoom] = useState(1)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)

  const currentPageData = pages[currentPage]

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0)
      setMode('single')
      setZoom(1)
      setImageLoaded(false)
      setImageError(false)
    }
  }, [isOpen])

  // Reset image state when page changes
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
    setZoom(1)
  }, [currentPage])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': onClose(); break
        case 'ArrowLeft': case 'ArrowUp':
          if (mode === 'single') goToPrev()
          break
        case 'ArrowRight': case 'ArrowDown':
          if (mode === 'single') goToNext()
          break
        case '+': case '=': handleZoomIn(); break
        case '-': handleZoomOut(); break
        case 'g': setMode(m => m === 'single' ? 'grid' : 'single'); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, currentPage, mode, pages.length])

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const goToPrev = useCallback(() => {
    setCurrentPage(p => Math.max(0, p - 1))
  }, [])

  const goToNext = useCallback(() => {
    setCurrentPage(p => Math.min(pages.length - 1, p + 1))
  }, [pages.length])

  const handleZoomIn = () => setZoom(z => Math.min(3, z + 0.25))
  const handleZoomOut = () => setZoom(z => Math.max(0.5, z - 0.25))

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    if (Math.abs(dx) > 50 && dy < 80) {
      if (dx > 0) goToPrev()
      else goToNext()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="guide-viewer-fullscreen flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={`${characterName} — ${title}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/[0.07] flex-shrink-0 no-print" style={{ background: 'rgba(3,5,8,0.95)', backdropFilter: 'blur(20px)' }}>
            <div className="min-w-0">
              <p className="text-[#4d6580] text-xs uppercase tracking-wider">{characterName}</p>
              <h2 className="text-white text-sm font-semibold truncate">{title}</h2>
            </div>

            <div className="flex items-center gap-1 mx-4 flex-shrink-0">
              {/* Grid / Single toggle */}
              <button
                onClick={() => setMode(m => m === 'single' ? 'grid' : 'single')}
                className="p-2 rounded-lg transition-colors"
                style={mode === 'grid' ? { background: 'rgba(0,200,255,0.12)', color: '#00c8ff' } : { color: '#4d6580' }}
                title="Toggle grid view (G)"
                aria-pressed={mode === 'grid'}
              >
                <LayoutGrid size={18} />
              </button>

              {mode === 'single' && (
                <>
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="p-2 rounded-lg text-[#4d6580] hover:text-white disabled:opacity-30 transition-colors"
                    title="Zoom out (-)"
                  >
                    <ZoomOut size={18} />
                  </button>
                  <span className="text-[#4d6580] text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    className="p-2 rounded-lg text-[#4d6580] hover:text-white disabled:opacity-30 transition-colors"
                    title="Zoom in (+)"
                  >
                    <ZoomIn size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Page indicator */}
            {mode === 'single' && (
              <div className="hidden sm:flex items-center gap-2 text-text-muted text-sm mr-4">
                <span className="text-text-primary font-medium">{currentPage + 1}</span>
                <span>/</span>
                <span>{pages.length}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-colors"
              aria-label="Close viewer (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          {mode === 'single' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Main image area */}
              <div
                ref={containerRef}
                className="flex-1 overflow-auto flex items-start justify-center p-4 md:p-8"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="relative inline-block max-w-full"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                >
                  {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 min-h-64 min-w-48 text-[#8fa8c4]">
                      <Loader2 size={32} className="text-[#00c8ff] animate-spin" />
                      <p className="text-xs">جارٍ تحميل المحتوى...</p>
                    </div>
                  )}

                  {imageError && (
                    <div className="flex flex-col items-center gap-3 py-16 px-8 text-red-400">
                      <AlertCircle size={40} className="text-red-400/80" />
                      <p className="text-sm">تعذّر تحميل المحتوى. حاول مرة أخرى.</p>
                    </div>
                  )}

                  {currentPageData && (
                    <img
                      key={currentPageData.id}
                      src={currentPageData.imagePath}
                      alt={`Page ${currentPageData.pageNumber} of ${title}`}
                      className={`block max-w-full h-auto rounded-lg shadow-card-hover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      style={{
                        maxHeight: zoom === 1 ? 'calc(100vh - 140px)' : undefined,
                        width: currentPageData.width && currentPageData.height
                          ? `min(${currentPageData.width}px, 100%)`
                          : '100%',
                      }}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => { setImageError(true); setImageLoaded(true) }}
                    />
                  )}
                </div>
              </div>

              {/* Navigation controls */}
              <div className="flex items-center justify-center gap-4 py-4 border-t border-border/40 bg-background-DEFAULT/90 backdrop-blur-sm flex-shrink-0 no-print" dir="rtl">
                <button
                  onClick={goToPrev}
                  disabled={currentPage === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-[#8fa8c4] hover:text-white hover:border-cyan-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
                >
                  <ChevronRight size={16} />
                  <span>الصفحة السابقة</span>
                </button>

                {/* Page dots (max 10 visible) */}
                <div className="flex items-center gap-1.5">
                  {pages.slice(
                    Math.max(0, currentPage - 4),
                    Math.min(pages.length, currentPage + 5)
                  ).map((_, i) => {
                    const pageIndex = Math.max(0, currentPage - 4) + i
                    return (
                      <button
                        key={pageIndex}
                        onClick={() => setCurrentPage(pageIndex)}
                        className={`rounded-full transition-all duration-200 ${
                          pageIndex === currentPage
                            ? 'w-6 h-2 bg-accent-cyan-DEFAULT'
                            : 'w-2 h-2 bg-border hover:bg-text-muted'
                        }`}
                        aria-label={`Go to page ${pageIndex + 1}`}
                      />
                    )
                  })}
                </div>

                <button
                  onClick={goToNext}
                  disabled={currentPage === pages.length - 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-[#8fa8c4] hover:text-white hover:border-cyan-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
                >
                  <span>الصفحة التالية</span>
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* Grid mode */
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
                {pages.map((page, i) => (
                  <button
                    key={page.id}
                    onClick={() => { setCurrentPage(i); setMode('single') }}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border transition-all duration-200 hover:-translate-y-1 ${
                      i === currentPage
                        ? 'border-accent-cyan-DEFAULT shadow-glow-cyan-sm'
                        : 'border-border hover:border-accent-cyan-DEFAULT/40'
                    }`}
                    aria-label={`Go to page ${page.pageNumber}`}
                  >
                    {page.thumbnailPath ? (
                      <img
                        src={page.thumbnailPath}
                        alt={`Page ${page.pageNumber}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-surface-DEFAULT flex items-center justify-center">
                        <Loader2 size={20} className="text-text-muted animate-spin" />
                      </div>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {page.pageNumber}
                    </div>
                    {i === currentPage && (
                      <div className="absolute inset-0 bg-accent-cyan-DEFAULT/10 ring-2 ring-accent-cyan-DEFAULT ring-inset rounded-xl" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
