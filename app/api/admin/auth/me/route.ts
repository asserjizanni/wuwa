import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getAdminSession()

  if (!session.adminId) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      id: session.adminId,
      email: session.email,
      role: session.role,
      name: session.name,
    },
  })
}
