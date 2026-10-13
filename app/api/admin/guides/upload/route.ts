import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import os from 'os'
import { prisma, safeDb } from '@/lib/db'
import { getAdminSession } from '@/lib/session'
import {
  getCharacterPaths,
  storagePathToPublic,
  sanitizeFilename,
} from '@/lib/storage'
import { getStoredCharacter, addStoredGuide } from '@/lib/data/characterStore'
import { saveGuidePages } from '@/lib/blob-store'
import {
  isSupabaseStorageConfigured,
  uploadBufferToStorage,
  parseDataUrl,
} from '@/lib/supabase-storage'

// Netlify serverless functions have a hard 6 MB body limit.
// Solution: client converts PDF pages to WebP images in the browser,
// then POSTs JSON { characterId, title, pages: string[] } where each
// page is a data:image/webp;base64,... URL (~200-400 KB each).

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const auditAdminId = session.adminId && session.adminId !== 'admin-system-master' ? session.adminId : null

  try {
    const contentType = request.headers.get('content-type') || ''

    // ── JSON mode: browser pre-renders PDF → sends WebP page data-URLs ────
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { characterId, title, pages } = body as {
        characterId?: string
        title?: string
        pages?: string[]
      }

      if (!characterId || !title?.trim()) {
        return NextResponse.json(
          { error: 'Missing required fields: characterId, title' },
          { status: 400 }
        )
      }
      if (!pages || !Array.isArray(pages) || pages.length === 0) {
        return NextResponse.json(
          { error: 'No pages provided. The PDF must be converted to images before uploading.' },
          { status: 400 }
        )
      }
      for (const pg of pages) {
        if (!pg.startsWith('data:image/')) {
          return NextResponse.json(
            { error: 'Invalid page format — expected data-URL image.' },
            { status: 400 }
          )
        }
      }
      return await handlePageImagesUpload({ characterId, title: title.trim(), pages, auditAdminId })
    }

    // ── Multipart mode (legacy / local dev — small PDFs only) ─────────────
    const formData = await request.formData()
    const characterId = formData.get('characterId') as string
    const title = formData.get('title') as string
    const pdfFile = formData.get('pdf') as File | null

    if (!characterId || !title || !pdfFile) {
      return NextResponse.json(
        { error: 'Missing required fields: characterId, title, pdf' },
        { status: 400 }
      )
    }

    if (!pdfFile.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must be a PDF document (.pdf)' }, { status: 400 })
    }

    // Netlify hard-caps at 6 MB — reject early with a friendly message
    const MAX_PDF_DIRECT = 5 * 1024 * 1024 // 5 MB safety margin
    if (pdfFile.size > MAX_PDF_DIRECT) {
      return NextResponse.json(
        {
          error:
            'PDF is too large for direct upload. Your browser should automatically convert it — please wait for the conversion to finish and try again.',
        },
        { status: 413 }
      )
    }

    const character =
      (await safeDb(
        () =>
          prisma.character.findUnique({
            where: { id: characterId },
            select: { id: true, slug: true, name: true, portraitPath: true },
          }),
        null
      )) || getStoredCharacter(characterId)

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const buffer = Buffer.from(await pdfFile.arrayBuffer())
    if (buffer.slice(0, 4).toString() !== '%PDF') {
      return NextResponse.json({ error: 'Invalid PDF file' }, { status: 400 })
    }

    const latestGuide = await safeDb(
      () =>
        prisma.buildGuide.findFirst({
          where: { characterId: character.id },
          orderBy: { version: 'desc' },
          select: { version: true },
        }),
      null
    )
    const version = (latestGuide?.version || 0) + 1

    const pdfFilename = sanitizeFilename(`guide-v${version}-${Date.now()}.pdf`)
    let pdfPublicPath = ''

    try {
      const charPaths = getCharacterPaths(character.slug)
      await mkdir(charPaths.original, { recursive: true })
      const pdfStoragePath = path.join(charPaths.original, pdfFilename)
      await writeFile(pdfStoragePath, buffer)
      pdfPublicPath = storagePathToPublic(pdfStoragePath)
    } catch {
      const tmpDir = path.join(os.tmpdir(), 'wuwa-storage', 'characters', character.slug, 'original')
      await mkdir(tmpDir, { recursive: true }).catch(() => {})
      await writeFile(path.join(tmpDir, pdfFilename), buffer).catch(() => {})
      pdfPublicPath = `/storage/characters/${character.slug}/original/${pdfFilename}`
    }

    const fallbackGuide = {
      id: `guide-${character.slug}-${Date.now()}`,
      title,
      version,
      originalPdfPath: pdfPublicPath,
      status: 'PUBLISHED' as const,
      isActive: true,
      pageCount: 1,
      pages: [
        {
          id: `page-${Date.now()}-1`,
          pageNumber: 1,
          imagePath: character.portraitPath || '/characters/jinhsi.jpg',
          thumbnailPath: character.portraitPath || '/characters/jinhsi.jpg',
          width: 1080,
          height: 1920,
        },
      ],
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    }

    addStoredGuide(character.id, fallbackGuide)

    return NextResponse.json(
      {
        success: true,
        guide: fallbackGuide,
        job: { id: `job-offline-${Date.now()}`, status: 'COMPLETED' },
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('[upload guide error]', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to process guide upload' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Save pre-rendered WebP page images sent as data-URLs from the browser
// ─────────────────────────────────────────────────────────────────────────────
async function handlePageImagesUpload({
  characterId,
  title,
  pages,
  auditAdminId,
}: {
  characterId: string
  title: string
  pages: string[]
  auditAdminId: string | null
}) {
  const character =
    (await safeDb(
      () =>
        prisma.character.findUnique({
          where: { id: characterId },
          select: { id: true, slug: true, name: true, portraitPath: true },
        }),
      null
    )) || getStoredCharacter(characterId)

  if (!character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  const latestGuide = await safeDb(
    () =>
      prisma.buildGuide.findFirst({
        where: { characterId: character.id },
        orderBy: { version: 'desc' },
        select: { version: true },
      }),
    null
  )
  const version = (latestGuide?.version || 0) + 1

  // 1. Create guide record in DB if available
  const dbGuide = await safeDb(async () => {
    return prisma.buildGuide.create({
      data: {
        characterId: character.id,
        title,
        version,
        originalPdfPath: '',
        status: 'READY',
        pageCount: pages.length,
      },
    })
  }, null)

  const guideId = dbGuide?.id || `guide-${character.slug}-${Date.now()}`

  interface PageImageEntry {
    pageNumber: number
    imagePath: string
    thumbnailPath: string
    width: number
    height: number
    fileSize: number
  }

  const savedPages: PageImageEntry[] = []

  // 2. Upload to Supabase Storage if configured (standard in production and local with .env.local)
  if (isSupabaseStorageConfigured()) {
    try {
      for (let i = 0; i < pages.length; i++) {
        const { buffer, contentType } = parseDataUrl(pages[i])
        const ext = contentType.includes('png') ? 'png' : 'webp'
        const imgObj = `guide-pages/${guideId}/${i + 1}/image.${ext}`
        const thumbObj = `guide-pages/${guideId}/${i + 1}/thumbnail.${ext}`

        const imgUrl = await uploadBufferToStorage({
          path: imgObj,
          buffer,
          contentType,
        })
        const thumbUrl = await uploadBufferToStorage({
          path: thumbObj,
          buffer,
          contentType,
        })

        savedPages.push({
          pageNumber: i + 1,
          imagePath: imgUrl,
          thumbnailPath: thumbUrl,
          width: 1200,
          height: 1697,
          fileSize: buffer.length,
        })
      }
    } catch (storageErr) {
      console.error('[upload guide] Supabase Storage upload error:', storageErr)
    }
  }

  // 3. Fallback: local disk if Supabase Storage was not configured or failed
  if (savedPages.length !== pages.length) {
    savedPages.length = 0
    const guideDirName = sanitizeFilename(`guide-v${version}-${Date.now()}`)
    const charPaths = getCharacterPaths(character.slug)
    const guideImagesDir = path.join(charPaths.guides, guideDirName)

    try {
      await mkdir(guideImagesDir, { recursive: true })
      for (let i = 0; i < pages.length; i++) {
        const { buffer } = parseDataUrl(pages[i])
        const filename = `page-${String(i + 1).padStart(3, '0')}.webp`
        await writeFile(path.join(guideImagesDir, filename), buffer)
        const pPath = storagePathToPublic(path.join(guideImagesDir, filename))
        savedPages.push({
          pageNumber: i + 1,
          imagePath: pPath,
          thumbnailPath: pPath,
          width: 1200,
          height: 1697,
          fileSize: buffer.length,
        })
      }
    } catch {
      // Last resort fallback (e.g. offline dev without Supabase on read-only FS)
      for (let i = 0; i < pages.length; i++) {
        savedPages.push({
          pageNumber: i + 1,
          imagePath: pages[i],
          thumbnailPath: pages[i],
          width: 1200,
          height: 1697,
          fileSize: 0,
        })
      }
    }
  }

  // 4. Persist guide pages in DB if DB guide was created
  if (dbGuide) {
    await safeDb(async () => {
      await prisma.guidePage.createMany({
        data: savedPages.map((p) => ({
          guideId: dbGuide.id,
          pageNumber: p.pageNumber,
          imagePath: p.imagePath,
          thumbnailPath: p.thumbnailPath,
          width: p.width,
          height: p.height,
          fileSize: p.fileSize,
        })),
      })

      if (auditAdminId) {
        await prisma.auditLog
          .create({
            data: {
              adminUserId: auditAdminId,
              action: 'UPLOAD_GUIDE_PAGES',
              targetType: 'BuildGuide',
              targetId: dbGuide.id,
              details: { characterId: character.id, title, version, pageCount: pages.length },
            },
          })
          .catch(() => {})
      }
    }, null)

    // Also persist pages to /tmp for cache
    await saveGuidePages({
      guideId: dbGuide.id,
      pages: savedPages.map((p) => ({
        pageNumber: p.pageNumber,
        imagePath: p.imagePath,
        thumbnailPath: p.thumbnailPath,
        width: p.width,
        height: p.height,
      })),
    }).catch(() => {})

    return NextResponse.json(
      {
        success: true,
        guide: {
          id: dbGuide.id,
          title: dbGuide.title,
          version: dbGuide.version,
          status: dbGuide.status,
          pageCount: dbGuide.pageCount,
        },
        job: { id: `job-pages-${Date.now()}`, status: 'COMPLETED' },
      },
      { status: 201 }
    )
  }

  // Offline/DB-down fallback
  const fallbackPages = savedPages.map((p, i) => ({
    id: `page-${Date.now()}-${i + 1}`,
    pageNumber: p.pageNumber,
    imagePath: p.imagePath,
    thumbnailPath: p.thumbnailPath,
    width: p.width,
    height: p.height,
  }))

  const fallbackGuide = {
    id: guideId,
    title,
    version,
    originalPdfPath: '',
    status: 'PUBLISHED' as const,
    isActive: true,
    pageCount: fallbackPages.length,
    pages: fallbackPages,
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  }

  await saveGuidePages({
    guideId,
    pages: fallbackPages,
  }).catch(() => {})

  addStoredGuide(character.id, fallbackGuide)

  return NextResponse.json(
    {
      success: true,
      guide: fallbackGuide,
      job: { id: `job-offline-${Date.now()}`, status: 'COMPLETED' },
    },
    { status: 201 }
  )
}
