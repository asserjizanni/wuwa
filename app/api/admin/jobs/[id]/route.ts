import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const job = await prisma.processingJob.findUnique({
    where: { id: params.id },
    include: {
      character: { select: { name: true, slug: true } },
      guide: { select: { title: true, status: true, pageCount: true } },
    },
  })

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  return NextResponse.json({ job })
}

// POST /api/admin/jobs/[id] - Retry failed job
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  if (body.action !== 'retry') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const job = await prisma.processingJob.findUnique({
    where: { id: params.id },
    include: {
      guide: { select: { id: true, originalPdfPath: true, version: true } },
      character: { select: { slug: true } },
    },
  })

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.status !== 'FAILED') {
    return NextResponse.json({ error: 'Only FAILED jobs can be retried' }, { status: 400 })
  }
  if (!job.guide?.originalPdfPath || !job.character?.slug) {
    return NextResponse.json({ error: 'Cannot retry: missing guide or character data' }, { status: 400 })
  }

  // Reset job and guide status
  await prisma.$transaction([
    prisma.processingJob.update({
      where: { id: params.id },
      data: {
        status: 'PENDING',
        progress: 0,
        processedPages: 0,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
      },
    }),
    prisma.buildGuide.update({
      where: { id: job.guideId! },
      data: { status: 'PROCESSING' },
    }),
  ])

  // Fire background retry
  const { processPdfToImages } = await import('@/lib/pdf-processor')
  const { publicPathToStorage } = await import('@/lib/storage')

  const pdfFsPath = publicPathToStorage(job.guide.originalPdfPath)
  const version = job.guide.version
  const slug = job.character.slug
  const guideId = job.guide.id
  const jobId = job.id

  ;(async () => {
    try {
      await prisma.processingJob.update({
        where: { id: jobId },
        data: { status: 'RUNNING', startedAt: new Date() },
      })

      const pages = await processPdfToImages(guideId, slug, pdfFsPath, version)

      await prisma.$transaction(async tx => {
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
          data: { status: 'COMPLETED', progress: 100, completedAt: new Date() },
        })
      })
    } catch (err) {
      await prisma.processingJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', errorMessage: String(err), completedAt: new Date() },
      }).catch(() => {})
    }
  })()

  return NextResponse.json({ success: true, message: 'Retry started' })
}
