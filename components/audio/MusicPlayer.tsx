'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Music, Disc3, ChevronUp, ChevronDown } from 'lucide-react'
import { audioManager } from '@/lib/audio-manager'

export default function MusicPlayer() {
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.35)

  useEffect(() => {
    setMounted(true)
    setIsPlaying(audioManager.isPlaying)
    setIsMuted(audioManager.isMuted)
    setVolume(audioManager.volume)

    const unsubscribe = audioManager.subscribe(() => {
      setIsPlaying(audioManager.isPlaying)
      setIsMuted(audioManager.isMuted)
      setVolume(audioManager.volume)
    })

    // Auto-initiate playback on first user click anywhere if not already playing and not muted
    const handleFirstInteraction = () => {
      if (!audioManager.isPlaying && !audioManager.isMuted) {
        audioManager.play().catch(() => {})
      }
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }

    window.addEventListener('click', handleFirstInteraction, { once: true })
    window.addEventListener('keydown', handleFirstInteraction, { once: true })

    return () => {
      unsubscribe()
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  if (!mounted) return null

  return (
    <div
      className="fixed bottom-5 left-5 z-40 select-none font-sans"
      dir="ltr"
      aria-label="Background Music Player"
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative group"
      >
        {/* Luminous Glow */}
        <div
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-cyan-500/20 blur-lg transition-opacity duration-500 -z-10 ${
            isPlaying && !isMuted ? 'opacity-80' : 'opacity-20'
          }`}
        />

        {/* Player Container */}
        <div className="flex flex-col rounded-2xl border border-cyan-500/25 bg-[#030712]/90 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] p-2 transition-all duration-300">
          {/* Main Controls Row */}
          <div className="flex items-center gap-2">
            {/* Vinyl / Disc icon with spinning animation */}
            <button
              onClick={() => audioManager.togglePlay()}
              className="relative w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-400/30 flex items-center justify-center text-[#00c8ff] hover:bg-cyan-900/50 hover:border-cyan-300 transition-all duration-200 overflow-hidden shrink-0 group/disc shadow-[0_0_15px_rgba(0,200,255,0.15)]"
              title={isPlaying ? 'Pause Background Music' : 'Play Background Music'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <Disc3
                size={22}
                className={`transition-all duration-700 ${
                  isPlaying && !isMuted ? 'animate-[spin_4s_linear_infinite] text-[#00c8ff]' : 'text-[#8fa8c4]'
                }`}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/disc:opacity-100 transition-opacity">
                {isPlaying ? (
                  <Pause size={14} className="text-white fill-white" />
                ) : (
                  <Play size={14} className="text-[#00c8ff] fill-[#00c8ff] ml-0.5" />
                )}
              </div>
            </button>

            {/* Track Info & Equalizer */}
            <div
              className="flex flex-col cursor-pointer px-1.5 py-0.5"
              onClick={() => setExpanded(!expanded)}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-white tracking-wide">
                  Wuthering Waves
                </span>
                {/* Equalizer Bars */}
                <div className="flex items-end gap-0.5 h-3 w-4 px-0.5" aria-hidden="true">
                  <span
                    className={`w-0.5 rounded-full bg-[#00c8ff] transition-all duration-300 ${
                      isPlaying && !isMuted ? 'animate-[pulse_0.7s_ease-in-out_infinite] h-full' : 'h-1 bg-slate-600'
                    }`}
                  />
                  <span
                    className={`w-0.5 rounded-full bg-[#38bdf8] transition-all duration-300 ${
                      isPlaying && !isMuted ? 'animate-[pulse_0.5s_ease-in-out_infinite_0.2s] h-2.5' : 'h-1 bg-slate-600'
                    }`}
                  />
                  <span
                    className={`w-0.5 rounded-full bg-[#a78bfa] transition-all duration-300 ${
                      isPlaying && !isMuted ? 'animate-[pulse_0.8s_ease-in-out_infinite_0.4s] h-3' : 'h-1 bg-slate-600'
                    }`}
                  />
                </div>
              </div>
              <span className="text-[9px] text-[#00c8ff]/90 font-mono font-semibold tracking-wider flex items-center gap-1">
                {isPlaying ? (isMuted ? 'MUTED' : 'NOW PLAYING') : 'PAUSED'}
                <span className="text-[#4d6580]">·</span>
                <span className="text-slate-400">Ambient OST</span>
              </span>
            </div>

            {/* Mute Button */}
            <button
              onClick={() => audioManager.toggleMute()}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-[#8fa8c4] hover:text-white hover:bg-white/5'
              }`}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {/* Expand / Settings Toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-8 rounded-lg flex items-center justify-center text-[#8fa8c4] hover:text-white transition-colors"
              title="Audio Controls"
              aria-label="Toggle Volume Slider"
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>

          {/* Expanded Drawer (Volume Slider & Extra Controls) */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden pt-2 mt-2 border-t border-white/[0.08]"
              >
                <div className="flex items-center gap-2.5 px-1 py-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0">
                    Vol {Math.round(volume * 100)}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      if (isMuted && v > 0) audioManager.toggleMute()
                      audioManager.setVolume(v)
                    }}
                    className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00c8ff]"
                    aria-label="Volume Slider"
                  />
                  <button
                    onClick={() => audioManager.setVolume(volume > 0.5 ? 0.2 : 0.6)}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900 transition-colors"
                  >
                    {volume > 0.5 ? 'Quiet' : 'Boost'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
