'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  RotateCw,
  Volume2,
  VolumeX,
  ExternalLink,
  Star,
  Zap,
  Filter,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  ChevronLeft
} from 'lucide-react'
import { audioManager } from '@/lib/audio-manager'

export interface SpinCharacter {
  id: string
  name: string
  slug: string
  element: string
  weaponType: string
  rarity: 'FOUR_STAR' | 'FIVE_STAR' | string
  portraitPath?: string | null
  hasGuide?: boolean
}

interface CharacterSpinClientProps {
  characters: SpinCharacter[]
}

const ELEMENT_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; glow: string }
> = {
  AERO: {
    label: 'Aero (رياح)',
    color: '#00e5a3',
    bg: 'rgba(0, 229, 163, 0.15)',
    border: 'rgba(0, 229, 163, 0.4)',
    glow: 'rgba(0, 229, 163, 0.6)',
  },
  SPECTRO: {
    label: 'Spectro (ضوء)',
    color: '#ffd54f',
    bg: 'rgba(255, 213, 79, 0.15)',
    border: 'rgba(255, 213, 79, 0.4)',
    glow: 'rgba(255, 213, 79, 0.6)',
  },
  FUSION: {
    label: 'Fusion (نار)',
    color: '#ff6e40',
    bg: 'rgba(255, 110, 64, 0.15)',
    border: 'rgba(255, 110, 64, 0.4)',
    glow: 'rgba(255, 110, 64, 0.6)',
  },
  ELECTRO: {
    label: 'Electro (برق)',
    color: '#b388ff',
    bg: 'rgba(179, 136, 255, 0.15)',
    border: 'rgba(179, 136, 255, 0.4)',
    glow: 'rgba(179, 136, 255, 0.6)',
  },
  GLACIO: {
    label: 'Glacio (جليد)',
    color: '#40c4ff',
    bg: 'rgba(64, 196, 255, 0.15)',
    border: 'rgba(64, 196, 255, 0.4)',
    glow: 'rgba(64, 196, 255, 0.6)',
  },
  HAVOC: {
    label: 'Havoc (ظلام)',
    color: '#e040fb',
    bg: 'rgba(224, 64, 251, 0.15)',
    border: 'rgba(224, 64, 251, 0.4)',
    glow: 'rgba(224, 64, 251, 0.6)',
  },
}

export default function CharacterSpinClient({ characters }: CharacterSpinClientProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [filterRarity, setFilterRarity] = useState<'ALL' | 'FIVE_STAR' | 'FOUR_STAR'>('ALL')
  const [filterElement, setFilterElement] = useState<string>('ALL')

  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<SpinCharacter | null>(null)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Current wheel rotation in radians
  const currentRotationRef = useRef<number>(0)
  const animFrameRef = useRef<number | null>(null)
  const lastTickSliceRef = useRef<number>(-1)

  // Filtered characters list
  const filteredCharacters = useMemo(() => {
    return characters.filter((c) => {
      if (filterRarity !== 'ALL' && c.rarity !== filterRarity) return false
      if (filterElement !== 'ALL' && c.element !== filterElement) return false
      return true
    })
  }, [characters, filterRarity, filterElement])

  // Preload character portrait images into Image objects for Canvas drawing
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map())

  useEffect(() => {
    filteredCharacters.forEach((c) => {
      if (c.portraitPath && !loadedImagesRef.current.has(c.id)) {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.src = c.portraitPath
        img.onload = () => {
          loadedImagesRef.current.set(c.id, img)
          drawWheel(currentRotationRef.current)
        }
      }
    })
  }, [filteredCharacters])

  useEffect(() => {
    setIsMuted(audioManager.isMuted)
    const unsub = audioManager.subscribe(() => {
      setIsMuted(audioManager.isMuted)
    })
    return () => unsub()
  }, [])

  // Draw the Gacha Wheel on HTML5 Canvas
  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const count = filteredCharacters.length
      if (count === 0) return

      const VIRTUAL_SIZE = 560
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
      const targetPixelSize = Math.round(VIRTUAL_SIZE * dpr)

      if (canvas.width !== targetPixelSize || canvas.height !== targetPixelSize) {
        canvas.width = targetPixelSize
        canvas.height = targetPixelSize
      }

      ctx.save()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, VIRTUAL_SIZE, VIRTUAL_SIZE)

      const width = VIRTUAL_SIZE
      const height = VIRTUAL_SIZE
      const centerX = width / 2
      const centerY = height / 2
      const radius = width / 2 - 24

      // ── 1. Outer Metallic Rim & Neon Glow ──
      ctx.save()
      ctx.shadowColor = '#00c8ff'
      ctx.shadowBlur = 28
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius + 12, 0, Math.PI * 2)
      ctx.strokeStyle = '#00c8ff'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.restore()

      // Metallic Bezel Gradient
      const bezelGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        radius,
        centerX,
        centerY,
        radius + 18
      )
      bezelGrad.addColorStop(0, '#060d1d')
      bezelGrad.addColorStop(0.5, '#1e293b')
      bezelGrad.addColorStop(0.8, '#00c8ff')
      bezelGrad.addColorStop(1, '#030712')

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius + 14, 0, Math.PI * 2)
      ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2, true)
      ctx.fillStyle = bezelGrad
      ctx.fill()

      // Outer Ticks around rim
      const totalTicks = count * 2
      for (let t = 0; t < totalTicks; t++) {
        const tickAngle = (t * Math.PI * 2) / totalTicks + rotation
        const innerTick = radius + 4
        const outerTick = radius + 11
        ctx.beginPath()
        ctx.moveTo(
          centerX + Math.cos(tickAngle) * innerTick,
          centerY + Math.sin(tickAngle) * innerTick
        )
        ctx.lineTo(
          centerX + Math.cos(tickAngle) * outerTick,
          centerY + Math.sin(tickAngle) * outerTick
        )
        ctx.strokeStyle = t % 2 === 0 ? '#38bdf8' : '#7c3aed'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // ── 2. Segments & Character Artwork ──
      const sliceAngle = (Math.PI * 2) / count

      filteredCharacters.forEach((char, i) => {
        const startAngle = i * sliceAngle + rotation
        const endAngle = startAngle + sliceAngle
        const midAngle = startAngle + sliceAngle / 2

        const elementInfo = ELEMENT_CONFIG[char.element] || {
          color: '#00c8ff',
          bg: 'rgba(0,200,255,0.1)',
        }

        // Slice Background Path
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.closePath()

        // Alternating dark sci-fi background tint
        const baseColor =
          i % 2 === 0
            ? 'rgba(10, 18, 35, 0.95)'
            : 'rgba(15, 25, 48, 0.95)'
        ctx.fillStyle = baseColor
        ctx.fill()

        // Subtle Element radial glow
        const sliceGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          50,
          centerX + Math.cos(midAngle) * radius * 0.7,
          centerY + Math.sin(midAngle) * radius * 0.7,
          radius * 0.5
        )
        sliceGrad.addColorStop(0, 'rgba(0,0,0,0)')
        sliceGrad.addColorStop(1, elementInfo.bg)
        ctx.fillStyle = sliceGrad
        ctx.fill()

        // Segment Border Line
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.25)'
        ctx.lineWidth = 1.2
        ctx.stroke()
        ctx.restore()

        // ── Character Avatar & Name in Slice ──
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(midAngle)

        // Character Name text (oriented radially)
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        const isFiveStar = char.rarity === 'FIVE_STAR'
        ctx.fillStyle = isFiveStar ? '#ffd54f' : '#ffffff'
        ctx.font = count > 24 ? 'bold 10px sans-serif' : 'bold 12px sans-serif'
        ctx.shadowColor = '#000000'
        ctx.shadowBlur = 6

        // Shorten long Arabic names if high count
        let displayName = char.name
        if (displayName.length > 9 && count > 20) {
          displayName = displayName.substring(0, 8) + '…'
        }
        ctx.fillText(displayName, radius - 44, 0)

        // Circular Avatar clipping
        const avatarDist = radius - 24
        const avatarRadius = count > 30 ? 12 : 16

        ctx.save()
        ctx.beginPath()
        ctx.arc(avatarDist, 0, avatarRadius, 0, Math.PI * 2)
        ctx.clip()

        const img = loadedImagesRef.current.get(char.id)
        if (img && img.complete) {
          ctx.drawImage(
            img,
            avatarDist - avatarRadius,
            -avatarRadius,
            avatarRadius * 2,
            avatarRadius * 2
          )
        } else {
          // Placeholder with element color
          ctx.fillStyle = elementInfo.color
          ctx.fillRect(
            avatarDist - avatarRadius,
            -avatarRadius,
            avatarRadius * 2,
            avatarRadius * 2
          )
        }
        ctx.restore()

        // Outer glow ring around character avatar
        ctx.beginPath()
        ctx.arc(avatarDist, 0, avatarRadius, 0, Math.PI * 2)
        ctx.strokeStyle = isFiveStar ? '#ffd54f' : elementInfo.color
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.restore()
      })

      // ── 3. Center Metallic Hub with Solaris Emblem ──
      ctx.save()
      const hubRadius = 42

      // Hub Outer Glow
      ctx.shadowColor = '#00c8ff'
      ctx.shadowBlur = 24
      ctx.beginPath()
      ctx.arc(centerX, centerY, hubRadius, 0, Math.PI * 2)
      ctx.fillStyle = '#030712'
      ctx.fill()
      ctx.lineWidth = 3.5
      ctx.strokeStyle = '#00c8ff'
      ctx.stroke()
      ctx.restore()

      // Inner Hub Radial Gradient
      const hubGrad = ctx.createRadialGradient(
        centerX - 10,
        centerY - 10,
        5,
        centerX,
        centerY,
        hubRadius - 4
      )
      hubGrad.addColorStop(0, '#38bdf8')
      hubGrad.addColorStop(0.4, '#0f172a')
      hubGrad.addColorStop(1, '#020617')

      ctx.beginPath()
      ctx.arc(centerX, centerY, hubRadius - 4, 0, Math.PI * 2)
      ctx.fillStyle = hubGrad
      ctx.fill()
      ctx.strokeStyle = '#ffd54f'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Center Crest Symbol (Wuthering Resonance Diamond)
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.beginPath()
      ctx.moveTo(0, -18)
      ctx.lineTo(13, 0)
      ctx.lineTo(0, 18)
      ctx.lineTo(-13, 0)
      ctx.closePath()
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = '#00c8ff'
      ctx.shadowBlur = 10
      ctx.fill()

      ctx.beginPath()
      ctx.arc(0, 0, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#00c8ff'
      ctx.fill()
      ctx.restore() // restore diamond symbol transform
      ctx.restore() // restore outer DPR transform
    },
    [filteredCharacters]
  )

  // Redraw when filter changes
  useEffect(() => {
    drawWheel(currentRotationRef.current)
  }, [drawWheel])

  // Redraw cleanly on window resize or orientation change
  useEffect(() => {
    const handleResize = () => {
      drawWheel(currentRotationRef.current)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawWheel])

  // ── Spin Trigger & Physics Easing ──
  const handleSpin = () => {
    if (isSpinning || filteredCharacters.length === 0) return

    setIsSpinning(true)
    setWinner(null)
    setShowWinnerModal(false)

    // Fair random selection
    const count = filteredCharacters.length
    const winnerIndex = Math.floor(Math.random() * count)
    const selectedChar = filteredCharacters[winnerIndex]

    // Play start audio
    audioManager.playSpinStart()

    // Calculate exact target rotation so winner is at top needle (3 * PI / 2 or -PI / 2)
    // Canvas pointer is at 12 o'clock (-PI / 2 radians or 270 degrees).
    const sliceAngle = (Math.PI * 2) / count
    const centerSliceAngle = winnerIndex * sliceAngle + sliceAngle / 2
    const needleAngle = -Math.PI / 2 // Top pointer

    // We need: (finalRotation + centerSliceAngle) % 2PI === needleAngle
    // So finalRotation = needleAngle - centerSliceAngle + K * 2PI
    const fullSpins = 6 + Math.floor(Math.random() * 3) // 6 to 8 full spins
    const currentRot = currentRotationRef.current
    const targetDelta =
      needleAngle -
      (centerSliceAngle + (currentRot % (Math.PI * 2))) +
      fullSpins * Math.PI * 2

    const startRotation = currentRot
    const finalRotation = startRotation + targetDelta

    const duration = 6200 // 6.2 seconds dramatic duration
    const startTime = performance.now()

    // Cubic-bezier deceleration physics: 1 - pow(1 - t, 4.5)
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4.5)

    lastTickSliceRef.current = -1

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(1, elapsed / duration)
      const easedProgress = easeOutQuart(progress)

      const currentAngle = startRotation + (finalRotation - startRotation) * easedProgress
      currentRotationRef.current = currentAngle

      // Determine active slice under pointer for audio tick
      const normalizedAngle = (-currentAngle - Math.PI / 2) % (Math.PI * 2)
      const positiveAngle =
        normalizedAngle < 0 ? normalizedAngle + Math.PI * 2 : normalizedAngle
      const currentSlice = Math.floor(positiveAngle / sliceAngle)

      if (currentSlice !== lastTickSliceRef.current) {
        lastTickSliceRef.current = currentSlice
        const pitch = 0.8 + (1 - progress) * 0.4
        audioManager.playWheelTick(pitch)
      }

      drawWheel(currentAngle)

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Spin finished!
        setIsSpinning(false)
        audioManager.playWheelStop()

        // Temporarily duck background music for dramatic reveal
        audioManager.duckVolume(0.08, 5000)

        // Play victory fanfare
        audioManager.playVictoryFanfare(selectedChar.rarity === 'FIVE_STAR')

        setWinner(selectedChar)
        setShowWinnerModal(true)
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  return (
    <div className="relative min-h-screen pt-24 pb-32 sm:pb-24 px-4 sm:px-6 overflow-hidden flex flex-col items-center">
      {/* Background Cosmic Glow & Particle Gradients */}
      <div className="absolute inset-0 bg-[#030508] -z-20" />
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background: [
            'radial-gradient(circle 800px at 50% 30%, rgba(0,200,255,0.09) 0%, transparent 70%)',
            'radial-gradient(circle 600px at 80% 80%, rgba(124,58,237,0.08) 0%, transparent 60%)',
            'radial-gradient(circle 500px at 20% 70%, rgba(255,213,79,0.06) 0%, transparent 60%)',
          ].join(', '),
        }}
      />

      {/* Header Banner */}
      <div className="max-w-4xl w-full text-center space-y-3 mb-8" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,200,255,0.2)]"
        >
          <Sparkles size={14} className="text-[#00c8ff] animate-pulse" />
          <span className="text-white text-xs font-black tracking-wide">
            Wuthering Gacha Wheel
          </span>
        </motion.div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">
          <span className="text-gradient-white">عجلة الحظ</span>{' '}
          <span className="text-gradient-cyan">للشخصيات</span>
        </h1>

        <p className="text-[#8fa8c4] text-sm sm:text-base max-w-xl mx-auto">
          جرّب حظك الآن مع شخصيات <span className="text-white font-bold">Wuthering Waves</span>!
          اختر تصنيفك المفضّل واضغط <span className="text-[#00c8ff] font-bold">SPIN</span> لاستكشاف Resonator جديد.
        </p>

        {/* Filter Badges & Audio Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
          {/* Rarity Filters */}
          <div className="inline-flex rounded-xl bg-[#070e1c] border border-white/10 p-1">
            <button
              onClick={() => {
                if (!isSpinning) setFilterRarity('ALL')
              }}
              disabled={isSpinning}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterRarity === 'ALL'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,200,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({characters.length})
            </button>
            <button
              onClick={() => {
                if (!isSpinning) setFilterRarity('FIVE_STAR')
              }}
              disabled={isSpinning}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                filterRarity === 'FIVE_STAR'
                  ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : 'text-amber-300/80 hover:text-amber-200'
              }`}
            >
              <Star size={12} className="fill-current" />
              <span>5 نجوم</span>
            </button>
            <button
              onClick={() => {
                if (!isSpinning) setFilterRarity('FOUR_STAR')
              }}
              disabled={isSpinning}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                filterRarity === 'FOUR_STAR'
                  ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'text-purple-300/80 hover:text-purple-200'
              }`}
            >
              <Star size={12} className="fill-current" />
              <span>4 نجوم</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => audioManager.toggleMute()}
            className={`p-2 rounded-xl border transition-all ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30 hover:border-cyan-400'
            }`}
            title={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
            aria-label="Sound Toggle"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>

      {/* ── Main Wheel Arena ── */}
      <div className="relative flex flex-col items-center justify-center my-4 w-full">
        {/* Top Fixed Metallic Needle Pointer */}
        <div className="absolute -top-5 sm:-top-6 z-30 flex flex-col items-center pointer-events-none drop-shadow-[0_4px_16px_rgba(0,200,255,0.7)]">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-b from-[#38bdf8] via-[#00c8ff] to-[#0284c7] border-2 border-white shadow-[0_0_20px_#00c8ff] flex items-center justify-center">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white animate-pulse" />
          </div>
          {/* Triangle Tip pointing down */}
          <div className="w-0 h-0 border-l-[10px] sm:border-l-[12px] border-l-transparent border-r-[10px] sm:border-r-[12px] border-r-transparent border-t-[18px] sm:border-t-[22px] border-t-[#00c8ff] -mt-1 sm:-mt-1.5 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
        </div>

        {/* Outer Glow Halo */}
        <div className="absolute -inset-4 sm:-inset-8 rounded-full bg-gradient-to-tr from-cyan-500/20 via-violet-600/15 to-transparent blur-3xl -z-10 pointer-events-none" />

        {/* Canvas Wheel */}
        <div className="relative p-2 sm:p-2.5 rounded-full bg-[#030611]/90 border border-cyan-500/20 shadow-[0_20px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(0,200,255,0.12)] w-[min(90vw,520px)] h-[min(90vw,520px)] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full block rounded-full select-none"
          />
        </div>
      </div>

      {/* ── Action Controls (Spin Button) ── */}
      <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3 w-full px-4">
        <button
          onClick={handleSpin}
          disabled={isSpinning || filteredCharacters.length === 0}
          className={`relative group w-full max-w-xs sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-xl tracking-wider transition-all duration-300 flex items-center justify-center gap-3 ${
            isSpinning
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#00c8ff] via-[#38bdf8] to-[#7c3aed] text-black hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(0,200,255,0.5)] hover:shadow-[0_0_60px_rgba(0,200,255,0.8)] border border-cyan-300'
          }`}
          aria-label="Spin Character Wheel"
        >
          <RotateCw
            size={20}
            className={`transition-all duration-700 ${
              isSpinning ? 'animate-spin text-slate-500' : 'text-black group-hover:rotate-180'
            }`}
          />
          <span>{isSpinning ? 'جاري السحب...' : 'ابدأ السحب (SPIN)'}</span>
          <Sparkles size={18} className="text-black" />
        </button>

        <p className="text-xs text-[#8fa8c4] flex items-center gap-1.5 font-medium">
          <span>عدد الشخصيات في العجلة:</span>
          <span className="text-[#00c8ff] font-bold font-mono">{filteredCharacters.length}</span>
          <span>من أصل {characters.length}</span>
        </p>
      </div>

      {/* ── Cinematic Winner Reveal Modal ── */}
      <AnimatePresence>
        {showWinnerModal && winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl">
            {/* Modal Outer Glow */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="relative max-w-lg w-full max-h-[92vh] overflow-y-auto rounded-3xl bg-[#040814]/95 border-2 border-cyan-400/50 shadow-[0_0_80px_rgba(0,200,255,0.35)] p-5 sm:p-8 text-center"
              dir="rtl"
            >
              {/* Radial Element Spotlight */}
              <div
                className="absolute -top-32 inset-x-0 h-64 blur-3xl pointer-events-none"
                style={{
                  background:
                    ELEMENT_CONFIG[winner.element]?.glow || 'rgba(0,200,255,0.4)',
                }}
              />

              {/* Title & Celebration */}
              <div className="space-y-1 mb-4 sm:mb-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-[#00c8ff] text-xs font-bold font-mono tracking-widest uppercase">
                  THE WAVES HAVE CHOSEN!
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
                  مبارك لك ربحت شخصية {winner.name}!
                </h2>
              </div>

              {/* Character Artwork Frame */}
              <div className="relative mx-auto w-44 h-56 sm:w-52 sm:h-64 rounded-2xl overflow-hidden border-2 border-cyan-400/60 shadow-[0_15px_40px_rgba(0,0,0,0.9),0_0_30px_rgba(0,200,255,0.3)] mb-5 group bg-slate-950">
                {winner.portraitPath ? (
                  <Image
                    src={winner.portraitPath}
                    alt={winner.name}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    unoptimized={winner.portraitPath.startsWith('data:')}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-black text-center">
                    <Sparkles size={32} className="text-[#00c8ff] mb-2" />
                    <span className="text-white font-bold text-sm">{winner.name}</span>
                  </div>
                )}

                {/* Bottom Gradient Fade */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#040814] to-transparent" />
              </div>

              {/* Character Info (Name, Stars, Element) */}
              <div className="space-y-2 mb-6">
                <h3 className="text-3xl font-black text-white tracking-tight">
                  {winner.name}
                </h3>

                {/* Star Rarity Row */}
                <div className="flex items-center justify-center gap-1">
                  {Array.from({ length: winner.rarity === 'FIVE_STAR' ? 5 : 4 }).map(
                    (_, s) => (
                      <Star
                        key={s}
                        size={18}
                        className={
                          winner.rarity === 'FIVE_STAR'
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_#fbbf24]'
                            : 'text-purple-400 fill-purple-400 drop-shadow-[0_0_6px_#c084fc]'
                        }
                      />
                    )
                  )}
                </div>

                {/* Badges: Element & Weapon */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-black border"
                    style={{
                      color: ELEMENT_CONFIG[winner.element]?.color || '#00c8ff',
                      backgroundColor:
                        ELEMENT_CONFIG[winner.element]?.bg || 'rgba(0,200,255,0.1)',
                      borderColor:
                        ELEMENT_CONFIG[winner.element]?.border || 'rgba(0,200,255,0.3)',
                    }}
                  >
                    {ELEMENT_CONFIG[winner.element]?.label || winner.element}
                  </span>
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-slate-300">
                    {winner.weaponType}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setShowWinnerModal(false)
                    handleSpin()
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,200,255,0.4)] flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <RotateCw size={16} />
                  <span>تدوير مجدداً (Spin Again)</span>
                </button>

                <Link
                  href={`/characters/${winner.slug}`}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>استعراض البِلد والدليل</span>
                  <ExternalLink size={15} />
                </Link>
              </div>

              {/* Close X Button */}
              <button
                onClick={() => setShowWinnerModal(false)}
                className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close Winner Reveal"
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
