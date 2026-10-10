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

  // Try to persist page images to disk
  const guideDirName = sanitizeFilename(`guide-v${version}-${Date.now()}`)
  const charPaths = getCharacterPaths(character.slug)
  const guideImagesDir = path.join(charPaths.guides, guideDirName)
  const savedPagePaths: string[] = []

  try {
    await mkdir(guideImagesDir, { recursive: true })
    for (let i = 0; i < pages.length; i++) {
      const base64 = pages[i].split(',')[1] || ''
      const buf = Buffer.from(base64, 'base64')
      const filename = `page-${String(i + 1).padStart(3, '0')}.webp`
      await writeFile(path.join(guideImagesDir, filename), buf)
      savedPagePaths.push(
        storagePathToPublic(path.join(guideImagesDir, filename))
      )
    }
  } catch {
    // Netlify: read-only FS outside /tmp — store placeholder paths
    for (let i = 0; i < pages.length; i++) {
      savedPagePaths.push(
        `/storage/characters/${character.slug}/guides/${guideDirName}/page-${String(i + 1).padStart(3, '0')}.webp`
      )
    }
  }

  // Attempt DB persist
  const dbResult = await safeDb(async () => {
    return prisma.$transaction(async (tx) => {
      const guide = await tx.buildGuide.create({
        data: {
          characterId: character.id,
          title,
          version,
          originalPdfPath: '',
          status: 'READY',
          pageCount: pages.length,
        },
      })

      await tx.guidePage.createMany({
        data: savedPagePaths.map((imgPath, i) => ({
          guideId: guide.id,
          pageNumber: i + 1,
          imagePath: imgPath,
          thumbnailPath: imgPath,
          width: 1200,
          height: 1697,
          fileSize: 0,
        })),
      })

      if (auditAdminId) {
        await tx.auditLog
          .create({
            data: {
              adminUserId: auditAdminId,
              action: 'UPLOAD_GUIDE_PAGES',
              targetType: 'BuildGuide',
              targetId: guide.id,
              details: { characterId: character.id, title, version, pageCount: pages.length },
            },
          })
          .catch(() => {})
      }

      return guide
    })
  }, null)

  if (dbResult) {
    return NextResponse.json(
      {
        success: true,
        guide: {
          id: dbResult.id,
          title: dbResult.title,
          version: dbResult.version,
          status: dbResult.status,
          pageCount: dbResult.pageCount,
        },
        job: { id: `job-pages-${Date.now()}`, status: 'COMPLETED' },
      },
      { status: 201 }
    )
  }

  // Offline/DB-down fallback
  const fallbackGuide = {
    id: `guide-${character.slug}-${Date.now()}`,
    title,
    version,
    originalPdfPath: '',
    status: 'PUBLISHED' as const,
    isActive: true,
    pageCount: savedPagePaths.length,
    pages: savedPagePaths.map((imgPath, i) => ({
      id: `page-${Date.now()}-${i + 1}`,
      pageNumber: i + 1,
      imagePath: imgPath,
      thumbnailPath: imgPath,
      width: 1200,
      height: 1697,
    })),
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
}
