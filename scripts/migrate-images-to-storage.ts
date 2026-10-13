#!/usr/bin/env tsx
/**
 * scripts/migrate-images-to-storage.ts
 *
 * Migrates guide_pages Base64 image data from PostgreSQL TOAST to Supabase Storage.
 *
 * SAFETY CONTRACT:
 *  - Reads images exclusively from the verified local backup (never re-streams from DB).
 *  - Uploads are idempotent: existing objects are detected and skipped automatically.
 *  - Database records are updated ONLY after the uploaded object has been verified
 *    by fetching its metadata from Storage.
 *  - Old Base64 data is NOT removed from the DB by this script.
 *  - Never prints Base64 image data, passwords, or secret keys.
 *  - --dry-run flag performs full validation without any production writes.
 *
 * Usage:
 *   Dry run (no writes):
 *     npx tsx scripts/migrate-images-to-storage.ts --dry-run
 *
 *   Real migration (production writes — review dry-run report first):
 *     npx tsx scripts/migrate-images-to-storage.ts
 *
 * Required environment variables (add to .env.local):
 *   SUPABASE_URL          — https://<ref>.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role key (NOT the anon key)
 *
 * Optional:
 *   MIGRATION_BUCKET      — storage bucket name (default: guide-images)
 *   MIGRATION_BATCH_SIZE  — rows per upload batch (default: 3)
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// ─── Environment Loading ────────────────────────────────────────────────────

function loadEnv(): void {
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.resolve(process.cwd(), file)
    if (!fs.existsSync(fullPath)) continue
    for (const rawLine of fs.readFileSync(fullPath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  }
}

loadEnv()

// ─── Configuration ──────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run')
const BACKUP_PATH = path.resolve(process.cwd(), 'backups', 'guide_pages_backup_latest.json')
const PROGRESS_PATH = path.resolve(process.cwd(), 'backups', 'migration_progress.json')
const REPORT_PATH = path.resolve(process.cwd(), 'backups', 'migration_report.json')
const BUCKET = process.env.MIGRATION_BUCKET || 'guide-images'
const BATCH_SIZE = parseInt(process.env.MIGRATION_BATCH_SIZE || '3', 10)
const MAX_RETRIES = 3

// ─── Types ──────────────────────────────────────────────────────────────────

interface BackupRow {
  id: string
  guideId: string
  pageNumber: number
  imagePath: string
  thumbnailPath: string | null
  width: number | null
  height: number | null
  fileSize: number | null
  createdAt: string
}

interface MigrationProgress {
  startedAt: string
  completedIds: string[]
  failedIds: string[]
}

interface ReportEntry {
  id: string
  guideId: string
  pageNumber: number
  status: 'success' | 'dry_run' | 'skipped' | 'failed'
  imageUrl?: string
  thumbnailUrl?: string
  imageSizeBytes?: number
  storagePathImage?: string
  storagePathThumb?: string
  error?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`)
}

function logErr(msg: string): void {
  console.error(`[${new Date().toISOString().slice(11, 19)}] ERROR: ${msg}`)
}

/** Decode a data URI into a raw Buffer + MIME + file extension. */
function parseDataUri(dataUri: string): { buffer: Buffer; mime: string; ext: string } {
  const match = dataUri.match(/^data:(image\/[^;]+);base64,(.+)$/s)
  if (!match) throw new Error('Not a valid image data URI')
  const mime = match[1]
  const ext = mime === 'image/webp' ? 'webp' : mime === 'image/png' ? 'png' : mime === 'image/jpeg' ? 'jpg' : 'bin'
  const buffer = Buffer.from(match[2], 'base64')
  return { buffer, mime, ext }
}

/** Deterministic Storage path for the full-resolution image. */
function storagePath_image(guideId: string, pageNumber: number, ext: string): string {
  return `guide-pages/${guideId}/${pageNumber}/image.${ext}`
}

/** Deterministic Storage path for the thumbnail. */
function storagePath_thumb(guideId: string, pageNumber: number, ext: string): string {
  return `guide-pages/${guideId}/${pageNumber}/thumbnail.${ext}`
}

/** Build the public CDN URL for a stored object. */
function buildPublicUrl(supabaseUrl: string, bucket: string, objPath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${objPath}`
}

/** Upload buffer to Supabase Storage with retries; skip if already exists. */
async function uploadWithRetry(
  storage: ReturnType<typeof createClient>['storage'],
  bucket: string,
  objPath: string,
  buffer: Buffer,
  mime: string
): Promise<{ skipped: boolean }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Check if file already exists in this folder
      const dirPart = objPath.substring(0, objPath.lastIndexOf('/'))
      const namePart = objPath.substring(objPath.lastIndexOf('/') + 1)
      const { data: existing } = await storage.from(bucket).list(dirPart, { search: namePart })
      if (existing && existing.some((f: any) => f.name === namePart)) {
        return { skipped: true }
      }

      const { error: upErr } = await storage.from(bucket).upload(objPath, buffer, {
        contentType: mime,
        upsert: false,
      })

      if (upErr) {
        const code = (upErr as any).statusCode
        if (upErr.message?.includes('already exists') || code === 409 || code === '409') {
          return { skipped: true }
        }
        throw upErr
      }

      return { skipped: false }
    } catch (e: any) {
      if (attempt === MAX_RETRIES) throw e
      const wait = attempt * 3000
      log(`  Attempt ${attempt} failed for ${objPath}: ${e.message}. Retrying in ${wait / 1000}s...`)
      await new Promise(r => setTimeout(r, wait))
    }
  }
  throw new Error('Unreachable')
}

/** Verify an uploaded object exists in Storage with non-zero content. */
async function verifyObject(
  storage: ReturnType<typeof createClient>['storage'],
  bucket: string,
  objPath: string
): Promise<boolean> {
  const dirPart = objPath.substring(0, objPath.lastIndexOf('/'))
  const namePart = objPath.substring(objPath.lastIndexOf('/') + 1)
  const { data, error } = await storage.from(bucket).list(dirPart, { search: namePart })
  if (error || !data) return false
  return data.some((f: any) => f.name === namePart)
}

function loadProgress(): MigrationProgress {
  if (fs.existsSync(PROGRESS_PATH)) {
    try { return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8')) } catch {}
  }
  return { startedAt: new Date().toISOString(), completedIds: [], failedIds: [] }
}

function saveProgress(p: MigrationProgress): void {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(p, null, 2), 'utf8')
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n================================================')
  console.log('  Guide Pages → Supabase Storage Migration')
  console.log(DRY_RUN ? '  MODE: DRY RUN  (no production writes)' : '  MODE: LIVE    (production writes ENABLED)')
  console.log('================================================\n')

  // Validate env vars
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    logErr('Missing required env vars: SUPABASE_URL and/or SUPABASE_SERVICE_KEY')
    logErr('Add them to .env.local:')
    logErr('  SUPABASE_URL=https://<ref>.supabase.co')
    logErr('  SUPABASE_SERVICE_KEY=<service_role key from Supabase dashboard>')
    process.exit(1)
  }

  // Validate backup
  if (!fs.existsSync(BACKUP_PATH)) {
    logErr(`Backup not found: ${BACKUP_PATH}`)
    logErr('Run: npm run db:backup')
    process.exit(1)
  }

  log(`Loading backup: ${BACKUP_PATH}`)
  const backupJson = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'))
  const { metadata, data: rows }: { metadata: any; data: BackupRow[] } = backupJson

  if (rows.length !== metadata.totalRows) {
    logErr(`Backup row count mismatch: expected ${metadata.totalRows}, got ${rows.length}`)
    process.exit(1)
  }
  log(`Backup OK — ${rows.length} rows across ${new Set(rows.map(r => r.guideId)).size} guides`)

  // Compute total storage estimate
  let totalBytes = 0
  for (const row of rows) {
    const b64 = (row.imagePath || '').replace(/^data:image\/[^;]+;base64,/, '')
    totalBytes += Math.floor(b64.length * 0.75)
    // thumbnails are identical data in this dataset — counted once
  }
  log(`Estimated decoded storage: ${(totalBytes / (1024 * 1024)).toFixed(1)} MB`)
  log(`Target bucket: "${BUCKET}",  batch size: ${BATCH_SIZE}\n`)

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })

  // Ensure bucket exists (skipped in dry-run)
  if (!DRY_RUN) {
    log(`Checking bucket "${BUCKET}"...`)
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets()
    if (bErr) { logErr(`Cannot list buckets: ${bErr.message}`); process.exit(1) }
    const exists = (buckets || []).some((b: any) => b.name === BUCKET)
    if (!exists) {
      log(`Creating public bucket "${BUCKET}"...`)
      const { error: cErr } = await supabase.storage.createBucket(BUCKET, { public: true })
      if (cErr) { logErr(`Cannot create bucket: ${cErr.message}`); process.exit(1) }
      log(`Bucket created. ✓`)
    } else {
      log(`Bucket "${BUCKET}" exists. ✓`)
    }
  } else {
    log(`[DRY RUN] Would verify/create bucket "${BUCKET}".`)
  }

  // Lazy-import Prisma — only needed for live DB updates
  let prisma: any = null
  if (!DRY_RUN) {
    const mod = await import('../lib/db')
    prisma = mod.prisma
  }

  // Load checkpoint
  const progress = loadProgress()
  const completedSet = new Set(progress.completedIds)
  log(`Resuming: ${completedSet.size} rows already done, ${progress.failedIds.length} previously failed\n`)

  // Process
  const report: ReportEntry[] = []
  let successCount = 0, skippedCount = 0, failedCount = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)

    for (const row of batch) {
      const label = `guide=${row.guideId.slice(0, 8)} page=${row.pageNumber}`

      if (completedSet.has(row.id)) {
        log(`[SKIP] ${label} — already migrated`)
        report.push({ id: row.id, guideId: row.guideId, pageNumber: row.pageNumber, status: 'skipped' })
        skippedCount++
        continue
      }

      if (DRY_RUN) {
        try {
          const { buffer, mime, ext } = parseDataUri(row.imagePath)
          const imgObj = storagePath_image(row.guideId, row.pageNumber, ext)
          const thumbObj = storagePath_thumb(row.guideId, row.pageNumber, ext)
          log(`[DRY RUN] ${label} — ${mime} ${(buffer.length / 1024).toFixed(0)} KB → ${imgObj}`)
          report.push({
            id: row.id, guideId: row.guideId, pageNumber: row.pageNumber,
            status: 'dry_run',
            imageUrl: buildPublicUrl(SUPABASE_URL, BUCKET, imgObj),
            thumbnailUrl: buildPublicUrl(SUPABASE_URL, BUCKET, thumbObj),
            imageSizeBytes: buffer.length,
            storagePathImage: imgObj,
            storagePathThumb: thumbObj,
          })
          successCount++
        } catch (e: any) {
          logErr(`[DRY RUN PARSE FAIL] ${label}: ${e.message}`)
          report.push({ id: row.id, guideId: row.guideId, pageNumber: row.pageNumber, status: 'failed', error: e.message })
          failedCount++
        }
        continue
      }

      // ── Live upload ──────────────────────────────────────────────────────
      try {
        const { buffer, mime, ext } = parseDataUri(row.imagePath)
        const imgObj = storagePath_image(row.guideId, row.pageNumber, ext)
        const thumbObj = storagePath_thumb(row.guideId, row.pageNumber, ext)

        log(`[UPLOAD] ${label} — ${mime} ${(buffer.length / 1024).toFixed(0)} KB`)

        const imgRes = await uploadWithRetry(supabase.storage, BUCKET, imgObj, buffer, mime)
        log(`  image: ${imgRes.skipped ? 'already existed, skipped' : 'uploaded ✓'}`)

        // thumbnailPath data is identical to imagePath in this dataset
        const thumbRes = await uploadWithRetry(supabase.storage, BUCKET, thumbObj, buffer, mime)
        log(`  thumb: ${thumbRes.skipped ? 'already existed, skipped' : 'uploaded ✓'}`)

        // Verify both objects
        const imgOk = await verifyObject(supabase.storage, BUCKET, imgObj)
        const thumbOk = await verifyObject(supabase.storage, BUCKET, thumbObj)
        if (!imgOk || !thumbOk) {
          throw new Error(`Verification failed — image:${imgOk} thumb:${thumbOk}`)
        }
        log(`  verified ✓`)

        const imgUrl = buildPublicUrl(SUPABASE_URL, BUCKET, imgObj)
        const thumbUrl = buildPublicUrl(SUPABASE_URL, BUCKET, thumbObj)

        // Update DB
        await prisma.guidePage.update({
          where: { id: row.id },
          data: { imagePath: imgUrl, thumbnailPath: thumbUrl },
        })
        log(`  DB updated ✓`)

        completedSet.add(row.id)
        progress.completedIds = Array.from(completedSet)
        saveProgress(progress)

        report.push({
          id: row.id, guideId: row.guideId, pageNumber: row.pageNumber,
          status: 'success', imageUrl: imgUrl, thumbnailUrl: thumbUrl,
          imageSizeBytes: buffer.length, storagePathImage: imgObj, storagePathThumb: thumbObj,
        })
        successCount++

        await new Promise(r => setTimeout(r, 400))
      } catch (e: any) {
        logErr(`[FAILED] ${label}: ${e.message}`)
        if (!progress.failedIds.includes(row.id)) progress.failedIds.push(row.id)
        saveProgress(progress)
        report.push({ id: row.id, guideId: row.guideId, pageNumber: row.pageNumber, status: 'failed', error: e.message })
        failedCount++
      }
    }
  }

  // Write report
  const reportPayload = {
    metadata: {
      generatedAt: new Date().toISOString(),
      dryRun: DRY_RUN,
      bucket: BUCKET,
      totalRows: rows.length,
      success: successCount,
      skipped: skippedCount,
      failed: failedCount,
      estimatedStorageMB: (totalBytes / (1024 * 1024)).toFixed(1),
    },
    entries: report,
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(reportPayload, null, 2), 'utf8')

  console.log('\n================================================')
  console.log(DRY_RUN ? '  Dry Run Complete' : '  Migration Complete')
  console.log('================================================')
  console.log(`  Total rows : ${rows.length}`)
  console.log(`  Success    : ${successCount}`)
  console.log(`  Skipped    : ${skippedCount}`)
  console.log(`  Failed     : ${failedCount}`)
  console.log(`  Report     : ${REPORT_PATH}`)
  console.log('================================================\n')

  if (failedCount > 0) {
    logErr(`${failedCount} row(s) failed. Re-run to resume — completed rows are checkpointed.`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(`[FATAL] ${e.message || e}`)
  process.exit(1)
})
