import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAdminSession } from '@/lib/session'
import { prisma, safeDb } from '@/lib/db'
import { getStoredCharacter, updateStoredCharacter } from '@/lib/data/characterStore'
import { getCharacterPaths, storagePathToPublic, sanitizeFilename } from '@/lib/storage'

const MAX_IMAGE_SIZE = 15 * 1024 * 1024 // 15MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
  'image/svg+xml',
]

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.svg']

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const characterId = formData.get('characterId') as string
    const type = (formData.get('type') as string) || 'portrait' // portrait | background
    const file = formData.get('file') as File | null

    if (!characterId || !file) {
      return NextResponse.json({ error: 'Missing characterId or file' }, { status: 400 })
    }

    const fileExt = path.extname(file.name || '').toLowerCase()
    const isMimeAllowed = file.type && ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())
    const isExtAllowed = fileExt && ALLOWED_EXTENSIONS.includes(fileExt)

    if (!isMimeAllowed && !isExtAllowed) {
      return NextResponse.json(
        { error: `Invalid file type (${file.type || fileExt}). Allowed: JPG, PNG, WebP, GIF, AVIF` },
        { status: 400 }
      )
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image too large (max 15MB)' }, { status: 413 })
    }

    // Lookup character by id or slug in DB and fallback store
    let characterSlug: string | null = null
    let targetCharId: string = characterId

    const dbChar = await safeDb(
      () => prisma.character.findFirst({
        where: {
          OR: [
            { id: characterId },
            { slug: characterId },
          ],
        },
        select: { id: true, slug: true },
      }),
      null
    )

    if (dbChar) {
      characterSlug = dbChar.slug
      targetCharId = dbChar.id
    } else {
      const stored = getStoredCharacter(characterId)
      if (stored) {
        characterSlug = stored.slug
        targetCharId = stored.id
      }
    }

    if (!characterSlug) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer())

    // Process with sharp if available; otherwise use raw buffer
    let processedBuffer = rawBuffer
    let isWebp = false
    const maxDimension = type === 'portrait' ? 800 : 1920

    try {
      const sharpMod: any = await import('sharp')
      const sharp = sharpMod?.default || sharpMod
      if (typeof sharp === 'function') {
        processedBuffer = await sharp(rawBuffer)
          .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 88 })
          .toBuffer()
        isWebp = true
      }
    } catch (sharpErr) {
      console.warn('[upload image] sharp processing fallback (using raw buffer):', sharpErr)
    }

    const ext = isWebp ? 'webp' : (fileExt.replace(/^\./, '') || 'webp')
    const filename = sanitizeFilename(`${type}-${Date.now()}.${ext}`)
    let publicPath = ''

    // Attempt writing to persistent local storage
    try {
      const charPaths = getCharacterPaths(characterSlug)
      await mkdir(charPaths.portraits, { recursive: true })
      const outputPath = path.join(charPaths.portraits, filename)
      await writeFile(outputPath, processedBuffer)
      publicPath = storagePathToPublic(outputPath)
    } catch (diskErr) {
      // Netlify or read-only filesystem: fallback to Data URL
      console.warn('[upload image] Disk write failed (read-only filesystem / Netlify). Storing as Data URL:', diskErr)
      const mime = isWebp ? 'image/webp' : (file.type || 'image/jpeg')
      publicPath = `data:${mime};base64,${processedBuffer.toString('base64')}`
    }

    // Update character record in DB
    await safeDb(
      () => prisma.character.update({
        where: { id: targetCharId },
        data: type === 'portrait'
          ? { portraitPath: publicPath }
          : { backgroundPath: publicPath },
      }),
      null
    )

    // Update character record in local store
    updateStoredCharacter(
      targetCharId,
      type === 'portrait' ? { portraitPath: publicPath } : { backgroundPath: publicPath }
    )

    return NextResponse.json({ success: true, path: publicPath })
  } catch (err: any) {
    console.error('[upload image] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}
