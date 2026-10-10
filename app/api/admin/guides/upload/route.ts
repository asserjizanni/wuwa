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
import { processPdfToImages, validatePdfBuffer } from '@/lib/pdf-processor'
import { getStoredCharacter, addStoredGuide } from '@/lib/data/characterStore'

const MAX_PDF_SIZE = parseInt(process.env.MAX_PDF_SIZE_BYTES || '104857600') // 100MB

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let jobId: string | null = null
  const auditAdminId = session.adminId && session.adminId !== 'admin-system-master' ? session.adminId : null

  try {
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

    // Validate file extension
    if (!pdfFile.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must be a PDF document (.pdf)' }, { status: 400 })
    }

    // Validate file size
    if (pdfFile.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: `PDF too large. Maximum size is ${MAX_PDF_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      )
    }

    // Get character from DB or persistent store
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
      return NextResponse.json({ error: 'Resonator character not found' }, { status: 404 })
    }

    // Read file buffer
    const buffer = Buffer.from(await pdfFile.arrayBuffer())

    // Validate PDF magic bytes
    const validation = await validatePdfBuffer(buffer)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || 'Invalid PDF file' }, { status: 400 })
    }

    // Calculate next guide version
    const latestGuide = await safeDb(
      () =>
        prisma.buildGuide.findFirst({
          where: { characterId: character.id },
          orderBy: { version: 'desc' },
          select: { version: true },
        }),
      null
    )
    const existingGuidesCount = (character as any).guides?.length || 0
    const version = Math.max(latestGuide?.version || 0, existingGuidesCount) + 1

    // Save original PDF (fallback to temp if storage is read-only)
    const pdfFilename = sanitizeFilename(`guide-v${version}-${Date.now()}.pdf`)
    let pdfStoragePath = ''
    let pdfPublicPath = ''

    try {
      const charPaths = getCharacterPaths(character.slug)
      await mkdir(charPaths.original, { recursive: true })
      pdfStoragePath = path.join(charPaths.original, pdfFilename)
      await writeFile(pdfStoragePath, buffer)
      pdfPublicPath = storagePathToPublic(pdfStoragePath)
    } catch {
      // Fallback to writable os.tmpdir
      const tmpDir = path.join(os.tmpdir(), 'wuwa-storage', 'characters', character.slug, 'original')
      await mkdir(tmpDir, { recursive: true }).catch(() => {})
      pdfStoragePath = path.join(tmpDir, pdfFilename)
      await writeFile(pdfStoragePath, buffer).catch(() => {})
      pdfPublicPath = `/storage/characters/${character.slug}/original/${pdfFilename}`
    }

    // Try database transaction
    const dbResult = await safeDb(async () => {
      return prisma.$transaction(async (tx) => {
        const guide = await tx.buildGuide.create({
          data: {
            characterId: character.id,
            title,
            version,
            originalPdfPath: pdfPublicPath,
            status: 'PROCESSING',
            pageCount: 0,
          },
        })

        const job = await tx.processingJob.create({
          data: {
            characterId: character.id,
            guideId: guide.id,
            status: 'PENDING',
            progress: 0,
            metadata: { filename: pdfFile.name, size: pdfFile.size },
          },
        })

        if (auditAdminId) {
          await tx.auditLog.create({
            data: {
              adminUserId: auditAdminId,
              action: 'UPLOAD_PDF',
              targetType: 'BuildGuide',
              targetId: guide.id,
              details: { characterId: character.id, title, version, filename: pdfFile.name },
            },
          }).catch(() => {})
        }

        return { guide, job }
      })
    }, null)

    if (dbResult) {
      jobId = dbResult.job.id

      // Process PDF in the background
      processPdfInBackground(dbResult.job.id, dbResult.guide.id, character.slug, pdfStoragePath, version)
        .catch(err => console.error('[pdf-bg]', err))

      return NextResponse.json({
        success: true,
        guide: { id: dbResult.guide.id, title: dbResult.guide.title, version: dbResult.guide.version, status: dbResult.guide.status },
        job: { id: dbResult.job.id, status: dbResult.job.status },
      }, { status: 201 })
    }

    // Offline / Fallback storage mode
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

    return NextResponse.json({
      success: true,
      guide: fallbackGuide,
      job: { id: `job-offline-${Date.now()}`, status: 'COMPLETED' },
    }, { status: 201 })
  } catch (err: any) {
    console.error('[upload pdf error]', err)

    if (jobId) {
      await safeDb(() =>
        prisma.processingJob.update({
          where: { id: jobId! },
          data: { status: 'FAILED', errorMessage: String(err) },
        }), null
      ).catch(() => {})
    }

    return NextResponse.json(
      { error: err?.message || 'Failed to process guide upload' },
      { status: 500 }
    )
  }
}

async function processPdfInBackground(
  jobId: string,
  guideId: string,
  characterSlug: string,
  pdfPath: string,
  version: number
) {
  try {
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    })

    const pages = await processPdfToImages(
      guideId,
      characterSlug,
      pdfPath,
      version,
      async (processed, total) => {
        await prisma.processingJob.update({
          where: { id: jobId },
          data: {
            progress: Math.round((processed / total) * 100),
            processedPages: processed,
            totalPages: total,
          },
        }).catch(() => {})
      }
    )

    await prisma.$transaction(async (tx) => {
      await tx.guidePage.deleteMany({ where: { guideId } })

      await tx.guidePage.createMany({
        data: pages.map(p => ({
          guideId,
          pageNumber: p.pageNumber,
          imagePath: p.imagePath,
          thumbnailPath: p.thumbnailPath,
          width: p.width,
          height: p.height,
          fileSize: p.fileSize,
        })),
      })

      await tx.buildGuide.update({
        where: { id: guideId },
        data: { status: 'READY', pageCount: pages.length },
      })

      await tx.processingJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          processedPages: pages.length,
          totalPages: pages.length,
          completedAt: new Date(),
        },
      })
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    await prisma.$transaction([
      prisma.processingJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', errorMessage: errorMsg, completedAt: new Date() },
      }),
      prisma.buildGuide.update({
        where: { id: guideId },
        data: { status: 'FAILED' },
      }),
    ]).catch(() => {})
  }
}
