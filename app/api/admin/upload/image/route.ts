import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAdminSession } from '@/lib/session'
import { prisma, safeDb } from '@/lib/db'
import { getStoredCharacter, updateStoredCharacter } from '@/lib/data/characterStore'
import { getCharacterPaths, storagePathToPublic, sanitizeFilename } from '@/lib/storage'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

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

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 413 })
    }

    let characterSlug: string | null = null

    const dbChar = await safeDb(
      () => prisma.character.findUnique({
        where: { id: characterId },
        select: { slug: true },
      }),
      null
    )

    if (dbChar) {
      characterSlug = dbChar.slug
    } else {
      const stored = getStoredCharacter(characterId)
      if (stored) {
        characterSlug = stored.slug
      }
    }

    if (!characterSlug) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const charPaths = getCharacterPaths(characterSlug)
    await mkdir(charPaths.portraits, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = sanitizeFilename(`${type}-${Date.now()}.webp`)
    const outputPath = path.join(charPaths.portraits, filename)

    // Process with sharp: resize and convert to WebP
    const sharp = (await import('sharp')).default
    const maxDimension = type === 'portrait' ? 800 : 1920
    await sharp(buffer)
      .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88 })
      .toFile(outputPath)

    const publicPath = storagePathToPublic(outputPath)

    // Update character record in DB and local store
    await safeDb(
      () => prisma.character.update({
        where: { id: characterId },
        data: type === 'portrait'
          ? { portraitPath: publicPath }
          : { backgroundPath: publicPath },
      }),
      null
    )

    updateStoredCharacter(
      characterId,
      type === 'portrait' ? { portraitPath: publicPath } : { backgroundPath: publicPath }
    )

    return NextResponse.json({ success: true, path: publicPath })
  } catch (err) {
    console.error('[upload image]', err)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
