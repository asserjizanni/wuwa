import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.auditLog.create({
    data: {
      adminUserId: session.adminId,
      action: 'LOGOUT',
    },
  }).catch(() => {})

  session.destroy()

  return NextResponse.json({ success: true })
}
