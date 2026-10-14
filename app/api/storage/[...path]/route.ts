import { NextRequest, NextResponse } from 'next/server'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import path from 'path'
import { getAdminSession } from '@/lib/session'
import { STORAGE_ROOT, preventPathTraversal } from '@/lib/storage'

const MIME_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.gif': 'image/gif',
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await context.params
  const relativePath = Array.isArray(params.path) ? params.path.join('/') : ''

  // Prevent path traversal
  let fsPath: string
  try {
    fsPath = preventPathTraversal(STORAGE_ROOT, relativePath)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Protect PDF files — only admins can access originals
  if (fsPath.toLowerCase().endsWith('.pdf')) {
    const session = await getAdminSession()
    if (!session.adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Check file exists
  try {
    await stat(fsPath)
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const contentType = getContentType(fsPath)

  // Read file and return
  const fileBuffer = await import('fs/promises').then(fs => fs.readFile(fsPath))

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
