import path from 'path'
import fs from 'fs/promises'
import { prisma } from './db'
import { getGuidePaths, ensureStorageDirectory, storagePathToPublic, STORAGE_PATHS } from './storage'

export interface PageExtractionResult {
  pageNumber: number
  imagePath: string
  thumbnailPath: string
  width: number
  height: number
  fileSize: number
}

export interface PdfProcessingOptions {
  dpi?: number
  quality?: number
  maxWidth?: number
}

// PDF processing via child process calling Python script
import { spawn } from 'child_process'

async function runPythonPdfProcessor(
  pdfPath: string,
  outputDir: string,
  thumbnailDir: string,
  options: PdfProcessingOptions
): Promise<{ pages: Array<{ page: number; width: number; height: number; path: string; thumbPath: string }> }> {
  const dpi = options.dpi || parseInt(process.env.PDF_RENDER_DPI || '250')
  const quality = options.quality || parseInt(process.env.PDF_IMAGE_QUALITY || '90')

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'pdf_processor.py')
    const args = [
      scriptPath,
      pdfPath,
      outputDir,
      thumbnailDir,
      String(dpi),
      String(quality),
    ]

    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    const proc = spawn(pythonCmd, args)

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on('close', (code: number) => {
      if (code !== 0) {
        reject(new Error(`PDF processor failed (exit ${code}): ${stderr}`))
        return
      }

      try {
        const result = JSON.parse(stdout)
        if (result.error) {
          reject(new Error(result.error))
        } else {
          resolve(result)
        }
      } catch (e) {
        reject(new Error(`Failed to parse PDF processor output: ${stdout} | ${stderr}`))
      }
    })

    proc.on('error', (err: Error) => {
      reject(new Error(`Failed to start PDF processor: ${err.message}`))
    })
  })
}

export async function processPdfToImages(
  guideId: string,
  characterSlug: string,
  pdfPath: string,
  version: number,
  onProgress?: (processed: number, total: number) => void
): Promise<PageExtractionResult[]> {
  const guidePaths = getGuidePaths(characterSlug, version)

  await Promise.all([
    ensureStorageDirectory(guidePaths.dir),
    ensureStorageDirectory(guidePaths.thumbnails),
  ])

  const result = await runPythonPdfProcessor(pdfPath, guidePaths.dir, guidePaths.thumbnails, {
    dpi: parseInt(process.env.PDF_RENDER_DPI || '250'),
    quality: parseInt(process.env.PDF_IMAGE_QUALITY || '90'),
  })

  const pages: PageExtractionResult[] = []

  for (const page of result.pages) {
    const imagePath = page.path
    const thumbnailPath = page.thumbPath

    const imagePublicPath = storagePathToPublic(imagePath)
    const thumbPublicPath = storagePathToPublic(thumbnailPath)

    const stat = await fs.stat(imagePath)

    pages.push({
      pageNumber: page.page,
      imagePath: imagePublicPath,
      thumbnailPath: thumbPublicPath,
      width: page.width,
      height: page.height,
      fileSize: stat.size,
    })

    if (onProgress) {
      onProgress(pages.length, result.pages.length)
    }
  }

  return pages.sort((a, b) => a.pageNumber - b.pageNumber)
}

export async function validatePdfBuffer(buffer: Buffer): Promise<{ valid: boolean; error?: string }> {
  // Check PDF magic bytes: %PDF-
  const pdfSignature = buffer.slice(0, 5).toString('ascii')
  if (pdfSignature !== '%PDF-') {
    return { valid: false, error: 'File is not a valid PDF (invalid signature)' }
  }
  return { valid: true }
}

export async function updateJobProgress(
  jobId: string,
  processed: number,
  total: number
): Promise<void> {
  const progress = total > 0 ? Math.round((processed / total) * 100) : 0
  await prisma.processingJob.update({
    where: { id: jobId },
    data: {
      progress,
      processedPages: processed,
      totalPages: total,
      status: 'RUNNING',
    },
  })
}

export async function generateThumbnail(
  imagePath: string,
  thumbnailPath: string,
  maxWidth = 400
): Promise<{ width: number; height: number }> {
  const sharp = (await import('sharp')).default
  const metadata = await sharp(imagePath).metadata()
  const ratio = (metadata.height || 1) / (metadata.width || 1)
  const thumbHeight = Math.round(maxWidth * ratio)

  await sharp(imagePath)
    .resize(maxWidth, thumbHeight, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(thumbnailPath)

  return { width: maxWidth, height: thumbHeight }
}
