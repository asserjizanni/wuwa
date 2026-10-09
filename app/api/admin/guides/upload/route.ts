import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/session'
import {
  getCharacterPaths,
  storagePathToPublic,
  preventPathTraversal,
  sanitizeFilename,
  STORAGE_PATHS,
} from '@/lib/storage'
import { processPdfToImages, validatePdfBuffer } from '@/lib/pdf-processor'

const MAX_PDF_SIZE = parseInt(process.env.MAX_PDF_SIZE_BYTES || '104857600') // 100MB

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let jobId: string | null = null

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
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    // Validate file size
    if (pdfFile.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: `PDF too large. Maximum size is ${MAX_PDF_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      )
    }

    // Get character
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { id: true, slug: true, name: true },
    })

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Read file buffer
    const buffer = Buffer.from(await pdfFile.arrayBuffer())

    // Validate PDF content (magic bytes)
    const validation = await validatePdfBuffer(buffer)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Calculate next guide version
    const latestGuide = await prisma.buildGuide.findFirst({
      where: { characterId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const version = (latestGuide?.version || 0) + 1

    // Save original PDF
    const charPaths = getCharacterPaths(character.slug)
    await mkdir(charPaths.original, { recursive: true })

    const pdfFilename = sanitizeFilename(`guide-v${version}-${Date.now()}.pdf`)
    const pdfStoragePath = path.join(charPaths.original, pdfFilename)
    await writeFile(pdfStoragePath, buffer)
    const pdfPublicPath = storagePathToPublic(pdfStoragePath)

    // Create guide and job records
    const { guide, job } = await prisma.$transaction(async (tx) => {
      const guide = await tx.buildGuide.create({
        data: {
          characterId,
          title,
          version,
          originalPdfPath: pdfPublicPath,
          status: 'PROCESSING',
          pageCount: 0,
        },
      })

      const job = await tx.processingJob.create({
        data: {
          characterId,
          guideId: guide.id,
          status: 'PENDING',
          progress: 0,
          metadata: { filename: pdfFile.name, size: pdfFile.size },
        },
      })

      await tx.auditLog.create({
        data: {
          adminUserId: session.adminId,
          action: 'UPLOAD_PDF',
          targetType: 'BuildGuide',
          targetId: guide.id,
          details: { characterId, title, version, filename: pdfFile.name },
        },
      })

      return { guide, job }
    })

    jobId = job.id

    // Process PDF in the background (fire and forget)
    processPdfInBackground(job.id, guide.id, character.slug, pdfStoragePath, version)
      .catch(err => console.error('[pdf-bg]', err))

    return NextResponse.json({
      success: true,
      guide: { id: guide.id, title: guide.title, version: guide.version, status: guide.status },
      job: { id: job.id, status: job.status },
    }, { status: 201 })
  } catch (err) {
    console.error('[upload pdf]', err)

    if (jobId) {
      await prisma.processingJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', errorMessage: String(err) },
      }).catch(() => {})
    }

    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 })
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
    // Mark job as running
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    })

    // Process pages
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

    // Save page records
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

    throw err
  }
}
