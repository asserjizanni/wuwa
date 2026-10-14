/**
 * lib/audio-manager.ts
 *
 * Professional Audio Manager for Wuthering Waves Builds:
 *  - Manages background music singleton (/videoplayback.m4a)
 *  - Handles browser autoplay policies cleanly
 *  - Smooth volume ducking during gacha reveal
 *  - Web Audio API synthesizer for wheel spin sound effects
 */

type AudioListener = () => void

class AudioManager {
  private bgAudio: HTMLAudioElement | null = null
  private webAudioCtx: AudioContext | null = null
  private listeners: Set<AudioListener> = new Set()

  public isPlaying = false
  public isMuted = false
  public volume = 0.35
  private baseVolume = 0.35
  private duckTimer: any = null

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('wuwa_bgm_muted')
        if (savedMute !== null) this.isMuted = savedMute === 'true'

        const savedVol = localStorage.getItem('wuwa_bgm_volume')
        if (savedVol !== null) {
          const v = parseFloat(savedVol)
          if (!isNaN(v) && v >= 0 && v <= 1) {
            this.volume = v
            this.baseVolume = v
          }
        }
      } catch {}
    }
  }

  /** Initialize or return background audio element */
  private getOrCreateBgAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null
    if (!this.bgAudio) {
      this.bgAudio = new Audio('/videoplayback.m4a')
      this.bgAudio.loop = true
      this.bgAudio.volume = this.isMuted ? 0 : this.volume
      this.bgAudio.preload = 'metadata'

      this.bgAudio.addEventListener('play', () => {
        this.isPlaying = true
        this.notify()
      })

      this.bgAudio.addEventListener('pause', () => {
        this.isPlaying = false
        this.notify()
      })

      this.bgAudio.addEventListener('ended', () => {
        this.isPlaying = false
        this.notify()
      })

      this.bgAudio.addEventListener('error', (e) => {
        console.warn('[AudioManager] Audio playback warning:', e)
        this.isPlaying = false
        this.notify()
      })
    }
    return this.bgAudio
  }

  /** Initialize or return Web Audio Context for synthesized SFX */
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.webAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtxClass) {
        this.webAudioCtx = new AudioCtxClass()
      }
    }
    if (this.webAudioCtx && this.webAudioCtx.state === 'suspended') {
      this.webAudioCtx.resume().catch(() => {})
    }
    return this.webAudioCtx
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn())
  }

  /** Play background music */
  public async play(): Promise<boolean> {
    const audio = this.getOrCreateBgAudio()
    if (!audio) return false

    try {
      audio.volume = this.isMuted ? 0 : this.volume
      await audio.play()
      this.isPlaying = true
      this.notify()
      return true
    } catch (err: any) {
      // Autoplay blocked by browser until user gesture
      this.isPlaying = false
      this.notify()
      return false
    }
  }

  /** Pause background music */
  public pause(): void {
    if (this.bgAudio) {
      this.bgAudio.pause()
      this.isPlaying = false
      this.notify()
    }
  }

  /** Toggle play / pause */
  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play().catch(() => {})
    }
  }

  /** Toggle mute / unmute */
  public toggleMute(): void {
    this.isMuted = !this.isMuted
    if (this.bgAudio) {
      this.bgAudio.volume = this.isMuted ? 0 : this.volume
    }
    try {
      localStorage.setItem('wuwa_bgm_muted', String(this.isMuted))
    } catch {}
    this.notify()
  }

  /** Set volume (0.0 to 1.0) */
  public setVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val))
    this.volume = clamped
    this.baseVolume = clamped
    if (this.bgAudio && !this.isMuted) {
      this.bgAudio.volume = clamped
    }
    try {
      localStorage.setItem('wuwa_bgm_volume', String(clamped))
    } catch {}
    this.notify()
  }

  /** Duck BGM volume temporarily during winner reveal */
  public duckVolume(duckLevel = 0.08, restoreAfterMs = 4500): void {
    if (!this.bgAudio || this.isMuted) return
    clearTimeout(this.duckTimer)

    this.bgAudio.volume = Math.min(duckLevel, this.baseVolume)

    this.duckTimer = setTimeout(() => {
      this.restoreVolume()
    }, restoreAfterMs)
  }

  /** Restore BGM volume */
  public restoreVolume(): void {
    if (!this.bgAudio || this.isMuted) return
    clearTimeout(this.duckTimer)
    // Smooth fade back to base volume
    const current = this.bgAudio.volume
    const target = this.baseVolume
    const steps = 10
    const stepDiff = (target - current) / steps
    let stepCount = 0

    const interval = setInterval(() => {
      stepCount++
      if (this.bgAudio && !this.isMuted) {
        this.bgAudio.volume = Math.min(target, Math.max(0, current + stepDiff * stepCount))
      }
      if (stepCount >= steps) {
        clearInterval(interval)
        if (this.bgAudio && !this.isMuted) this.bgAudio.volume = target
      }
    }, 40)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Synthesized Sound Effects via Web Audio API (zero extra files, zero latency)
  // ───────────────────────────────────────────────────────────────────────────

  /** Wheel ticker tick sound */
  public playWheelTick(pitch = 1): void {
    if (this.isMuted) return
    const ctx = this.getAudioContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(600 * pitch, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(120 * pitch, ctx.currentTime + 0.04)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2400, ctx.currentTime)

      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.05)
    } catch {}
  }

  /** Wheel spin start sound */
  public playSpinStart(): void {
    if (this.isMuted) return
    const ctx = this.getAudioContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4)

      gain.gain.setValueAtTime(0.01, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }

  /** Wheel stop / lock impact sound */
  public playWheelStop(): void {
    if (this.isMuted) return
    const ctx = this.getAudioContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(180, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.3)

      gain.gain.setValueAtTime(0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    } catch {}
  }

  /** Victory reveal chime & fanfare */
  public playVictoryFanfare(isFiveStar = true): void {
    if (this.isMuted) return
    const ctx = this.getAudioContext()
    if (!ctx) return

    try {
      // Pentatonic celebratory arpeggio: C5, E5, G5, B5, C6 (or higher for 5-star)
      const freqs = isFiveStar
        ? [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51]
        : [440.0, 554.37, 659.25, 880.0]

      freqs.forEach((freq, idx) => {
        const startTime = ctx.currentTime + idx * 0.08
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, startTime)

        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(startTime)
        osc.stop(startTime + 0.85)
      })
    } catch {}
  }
}

export const audioManager = new AudioManager()
