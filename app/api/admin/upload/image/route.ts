import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { getAdminSession } from '@/lib/session'
import { prisma } from '@/lib/db'
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

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { slug: true },
    })

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const charPaths = getCharacterPaths(character.slug)
    await mkdir(charPaths.portraits, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = sanitizeFilename(`${type}-${Date.now()}.webp`)
    const outputPath = path.join(charPaths.portraits, filename)

    // Process with sharp: resize and convert to WebP
    const maxDimension = type === 'portrait' ? 800 : 1920
    await sharp(buffer)
      .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88 })
      .toFile(outputPath)

    const publicPath = storagePathToPublic(outputPath)

    // Update character record
    await prisma.character.update({
      where: { id: characterId },
      data: type === 'portrait'
        ? { portraitPath: publicPath }
        : { backgroundPath: publicPath },
    })

    return NextResponse.json({ success: true, path: publicPath })
  } catch (err) {
    console.error('[upload image]', err)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
