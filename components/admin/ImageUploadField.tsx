'use client'

import React, { useState, useRef, useEffect } from 'react'
import { UploadCloud, Loader2, X, Image as ImageIcon, CheckCircle, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

export interface ImageUploadFieldProps {
  label?: string
  value: string
  onChange: (url: string) => void
  folder?: string
  type?: 'icon' | 'portrait' | 'background' | 'artwork' | 'image'
  characterId?: string
  placeholder?: string
  aspectRatio?: 'square' | 'portrait' | 'banner' | 'auto'
  helperText?: string
  required?: boolean
  compact?: boolean
  className?: string
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  folder = 'uploads',
  type = 'icon',
  characterId,
  placeholder = '/images/... or https://...',
  aspectRatio = 'square',
  helperText,
  required = false,
  compact = false,
  className = '',
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [imgError, setImgError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setImgError(false)
  }, [value])

  const handleFileChange = async (file: File) => {
    if (!file) return

    // Quick client-side check
    if (!file.type.startsWith('image/') && !file.name.endsWith('.svg') && !file.name.endsWith('.ico')) {
      toast.error('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP, SVG, GIF)')
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً (الحد الأقصى 25 ميجابايت)')
      return
    }

    setUploading(true)
    const loadingToast = toast.loading('جاري رفع الصورة من الجهاز...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      formData.append('type', type)
      if (characterId) {
        formData.append('characterId', characterId)
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل رفع الصورة')
      }

      const uploadedUrl = data.url || data.path
      onChange(uploadedUrl)
      toast.success('تم رفع الصورة بنجاح!', { id: loadingToast })
    } catch (err: any) {
      console.error('[ImageUploadField error]:', err)
      toast.error(err.message || 'حدث خطأ أثناء رفع الصورة', { id: loadingToast })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const getPreviewDimensions = () => {
    switch (aspectRatio) {
      case 'portrait':
        return 'w-24 h-32 sm:w-28 sm:h-36 aspect-[3/4]'
      case 'banner':
        return 'w-36 h-20 sm:w-44 sm:h-24 aspect-video'
      case 'square':
      default:
        return 'w-14 h-14 sm:w-16 sm:h-16 aspect-square'
    }
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-300">
            {label} {required && <span className="text-rose-400">*</span>}
          </label>
          {value && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle className="w-3 h-3" /> تم تحديد صورة
            </span>
          )}
        </div>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.svg,.ico,.avif"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileChange(file)
        }}
        className="hidden"
      />

      {/* Main container */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex items-center gap-3 p-2 rounded-xl bg-[#050914] border transition-all ${
          dragOver
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-white/10 hover:border-white/20 focus-within:border-cyan-500/60'
        }`}
      >
        {/* Preview / Upload trigger thumbnail */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          title="اضغط لتغيير أو رفع صورة من الجهاز"
          className={`relative group rounded-lg bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer transition ${getPreviewDimensions()} ${
            uploading ? 'opacity-70' : 'hover:border-cyan-400/60'
          }`}
        >
          {value && !imgError ? (
            <>
              <img
                src={value}
                alt="preview"
                className="w-full h-full object-contain p-0.5"
                onError={() => setImgError(true)}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] text-cyan-300 gap-1 font-semibold">
                <UploadCloud className="w-4 h-4" />
                <span>تغيير</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors p-1 text-center">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              ) : (
                <>
                  <ImageIcon className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-medium leading-tight">رفع</span>
                </>
              )}
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            </div>
          )}
        </div>

        {/* Input & Action buttons */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400/50"
            />

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                title="حذف الصورة"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {value && value.startsWith('http') && (
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                title="فتح الرابط في تبويب جديد"
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 border border-transparent hover:border-white/10 transition shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-sm shadow-cyan-950/40"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>جاري الرفع...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>رفع من الجهاز</span>
                </>
              )}
            </button>

            <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
              {helperText || 'أو اسحب الملف هنا مباشرة (PNG, WebP, SVG)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
