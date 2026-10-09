'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'فشل تسجيل الدخول / Login failed')
        return
      }

      toast.success('مرحباً بعودتك! تم تسجيل الدخول بنجاح')
      window.location.href = '/control-center/dashboard'
    } catch {
      toast.error('خطأ في الاتصال، يرجى المحاولة لاحقاً')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#03060d] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden text-white">
      {/* Background glowing effects */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: [
            'radial-gradient(circle 800px at 50% 20%, rgba(0,200,255,0.08) 0%, transparent 70%)',
            'radial-gradient(circle 600px at 80% 80%, rgba(232,163,46,0.05) 0%, transparent 60%)',
          ].join(', '),
        }}
      />
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none -z-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,200,255,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,200,255,0.6) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-3xl border border-white/[0.08] relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(12,18,32,0.92) 0%, rgba(6,10,18,0.98) 100%)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 50px rgba(0,200,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Top glowing line */}
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#00c8ff] to-transparent" />

        {/* Brand header with Character Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-br from-[#00c8ff] via-[#38bdf8] to-[#7c3aed] shadow-[0_0_28px_rgba(0,200,255,0.45)] mb-3">
            <div className="w-full h-full rounded-full overflow-hidden relative bg-[#040812]">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" sizes="64px" priority />
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#00c8ff] tracking-[0.25em] uppercase font-mono mb-1">
            Wuthering Waves Builds
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            لوحة الإدارة المركزية
          </h1>
          <p className="text-[#8fa8c4] text-xs mt-1">Control Center Administration</p>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2.5 mb-6 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-[#8fa8c4]">
          <ShieldCheck size={16} className="text-[#00c8ff] shrink-0" />
          <span>منطقة إدارة محمية ومشفرة للمصرح لهم فقط</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-bold text-[#8fa8c4] mb-2">
              البريد الإلكتروني (Email)
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@wwbuilds.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-[#080d1a] border border-white/10 text-white placeholder-[#4d6580] text-sm focus:outline-none focus:border-[#00c8ff]/60 transition-colors"
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="admin-password" className="block text-xs font-bold text-[#8fa8c4]">
                كلمة المرور (Password)
              </label>
            </div>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-4 py-3 pl-11 rounded-xl bg-[#080d1a] border border-white/10 text-white placeholder-[#4d6580] text-sm focus:outline-none focus:border-[#00c8ff]/60 transition-colors"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4d6580] hover:text-white transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-[#020609] bg-gradient-to-r from-[#00c8ff] to-[#0099ff] hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,200,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جارٍ التحقق والدخول...</span>
              </>
            ) : (
              <>
                <span>تسجيل الدخول</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
