import { NextRequest, NextResponse } from 'next/server'
import { prisma, safeDb } from '@/lib/db'
import { getAdminSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || ''

  const result = await safeDb(async () => {
    const where: any = {}
    if (status) where.status = status

    const [jobs, total] = await Promise.all([
      prisma.processingJob.findMany({
        where,
        include: {
          character: { select: { id: true, name: true, slug: true, element: true } },
          guide: { select: { id: true, title: true, version: true, status: true, pageCount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.processingJob.count({ where }),
    ])

    return {
      jobs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  }, null)

  if (result) {
    return NextResponse.json(result)
  }

  return NextResponse.json({
    jobs: [],
    pagination: { page, limit, total: 0, pages: 1 },
  })
}
