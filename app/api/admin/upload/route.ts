import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAdminSession } from '@/lib/session'
import { prisma, safeDb } from '@/lib/db'
import { getStoredCharacter, updateStoredCharacter } from '@/lib/data/characterStore'
import { STORAGE_ROOT, sanitizeFilename, storagePathToPublic } from '@/lib/storage'
import { isSupabaseStorageConfigured, uploadBufferToStorage } from '@/lib/supabase-storage'

const MAX_IMAGE_SIZE = 25 * 1024 * 1024 // 25MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.svg', '.ico']

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized: Admin login required' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = sanitizeFilename((formData.get('folder') as string) || 'uploads')
    const type = (formData.get('type') as string) || 'image'
    const characterId = formData.get('characterId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const originalName = file.name || 'image'
    const rawExt = path.extname(originalName).toLowerCase()
    const isMimeAllowed = file.type && ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())
    const isExtAllowed = rawExt && ALLOWED_EXTENSIONS.includes(rawExt)

    if (!isMimeAllowed && !isExtAllowed) {
      return NextResponse.json(
        { error: `Invalid image type (${file.type || rawExt}). Supported: JPG, PNG, WebP, GIF, SVG, AVIF, ICO` },
        { status: 400 }
      )
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image file too large (Max 25MB)' }, { status: 413 })
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer())

    // Preserve vector SVGs, ICO, and GIFs directly without rasterization
    const isVectorOrAnim = rawExt === '.svg' || rawExt === '.ico' || rawExt === '.gif' || file.type === 'image/svg+xml'

    let processedBuffer = rawBuffer
    let isWebp = false

    if (!isVectorOrAnim) {
      try {
        const sharpMod: any = await import('sharp')
        const sharp = sharpMod?.default || sharpMod
        if (typeof sharp === 'function') {
          let maxDimension = 1920
          let quality = 90

          if (type === 'icon' || folder === 'echoes' || folder === 'weapons' || folder === 'sonata-sets') {
            maxDimension = 512
            quality = 92
          } else if (type === 'portrait') {
            maxDimension = 1200
            quality = 90
          } else if (type === 'background') {
            maxDimension = 2560
            quality = 88
          }

          processedBuffer = await sharp(rawBuffer)
            .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality })
            .toBuffer()
          isWebp = true
        }
      } catch (sharpErr) {
        console.warn('[upload] sharp optimization fallback (using raw buffer):', sharpErr)
      }
    }

    const ext = isWebp ? 'webp' : (rawExt.replace(/^\./, '') || 'webp')
    const mime = isWebp ? 'image/webp' : (file.type || 'image/jpeg')

    const baseName = sanitizeFilename(path.basename(originalName, rawExt)) || 'asset'
    const filename = `${baseName}-${Date.now()}.${ext}`

    let publicUrl = ''

    // 1. Upload to Supabase Storage if configured
    if (isSupabaseStorageConfigured()) {
      try {
        const storagePath = `${folder}/${filename}`
        publicUrl = await uploadBufferToStorage({
          path: storagePath,
          buffer: processedBuffer,
          contentType: mime,
        })
      } catch (storageErr) {
        console.error('[upload] Supabase Storage upload failed, attempting local fallback:', storageErr)
      }
    }

    // 2. Fallback to local storage
    if (!publicUrl) {
      try {
        const targetDir = path.join(STORAGE_ROOT, folder)
        await mkdir(targetDir, { recursive: true })
        const outputPath = path.join(targetDir, filename)
        await writeFile(outputPath, processedBuffer)
        publicUrl = storagePathToPublic(outputPath)
      } catch (diskErr) {
        console.warn('[upload] Disk write fallback to Data URL:', diskErr)
        publicUrl = `data:${mime};base64,${processedBuffer.toString('base64')}`
      }
    }

    // 3. Optional character record update if characterId and type (portrait/background) are provided
    if (characterId && (type === 'portrait' || type === 'background')) {
      try {
        await safeDb(
          () =>
            prisma.character.updateMany({
              where: {
                OR: [{ id: characterId }, { slug: characterId }],
              },
              data: type === 'portrait' ? { portraitPath: publicUrl } : { backgroundPath: publicUrl },
            }),
          null
        )
        updateStoredCharacter(
          characterId,
          type === 'portrait' ? { portraitPath: publicUrl } : { backgroundPath: publicUrl }
        )
      } catch (dbErr) {
        console.warn('[upload] Character link warning:', dbErr)
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: publicUrl,
      filename,
      size: processedBuffer.length,
    })
  } catch (err: any) {
    console.error('[upload] Fatal error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}
