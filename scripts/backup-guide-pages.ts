#!/usr/bin/env tsx
/**
 * scripts/backup-guide-pages.ts
 *
 * Exports all records from public.guide_pages into a local JSON backup file.
 * Preserves every original column and complete values, including Base64 data.
 * Does not modify any database records. Does not print secrets or passwords.
 *
 * Usage:
 *   npx tsx scripts/backup-guide-pages.ts
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Load environment variables without external dependencies
function loadEnvFiles() {
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.resolve(process.cwd(), file)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8')
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue
        const eqIdx = line.indexOf('=')
        if (eqIdx === -1) continue
        const key = line.slice(0, eqIdx).trim()
        let val = line.slice(eqIdx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
}
loadEnvFiles()

import { prisma } from '../lib/db'

async function main() {
  console.log('\n========================================')
  console.log('   Starting guide_pages Table Backup    ')
  console.log('========================================\n')

  const startTime = Date.now()

  // 1. Ensure local backup directory exists (outside public/)
  const backupDir = path.resolve(process.cwd(), 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
    console.log(`[backup] Created backup directory: ${backupDir}`)
  }

  // 2. Query all IDs in order (metadata only, fast query)
  console.log('[backup] Querying all guide_pages IDs from database...')
  const allIds = await prisma.guidePage.findMany({
    select: { id: true },
    orderBy: [
      { guideId: 'asc' },
      { pageNumber: 'asc' },
    ],
  })
  const totalInDb = allIds.length
  console.log(`[backup] Database reports ${totalInDb} rows in guide_pages.`)

  if (totalInDb === 0) {
    console.warn('[backup] Warning: guide_pages table is empty. Nothing to export.')
    return
  }

  // 3. Load any existing in-progress checkpoint to resume gracefully
  const checkpointPath = path.join(backupDir, 'guide_pages_backup_in_progress.json')
  const pagesMap = new Map<string, any>()

  if (fs.existsSync(checkpointPath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'))
      if (Array.isArray(existingData)) {
        for (const row of existingData) {
          if (row.id) pagesMap.set(row.id, row)
        }
        console.log(`[backup] Found existing progress checkpoint: ${pagesMap.size} rows already saved. Resuming...`)
      }
    } catch {
      // Invalid checkpoint, will restart
    }
  }

  // 4. Identify remaining IDs to fetch
  const remainingIds = allIds.map(r => r.id).filter(id => !pagesMap.has(id))
  console.log(`[backup] ${remainingIds.length} rows remaining to download (out of ${totalInDb}).`)

  const BATCH_SIZE = 5 // 5 rows = ~10 MB payload per query
  for (let i = 0; i < remainingIds.length; i += BATCH_SIZE) {
    const batchIds = remainingIds.slice(i, i + BATCH_SIZE)
    const currentCount = pagesMap.size + batchIds.length
    process.stdout.write(`  -> Fetching batch (${pagesMap.size + 1}..${currentCount} of ${totalInDb})... `)

    let success = false
    let attempts = 0
    while (!success && attempts < 4) {
      attempts++
      const batchStart = Date.now()
      try {
        const batchRows = await prisma.guidePage.findMany({
          where: { id: { in: batchIds } },
        })

        for (const row of batchRows) {
          pagesMap.set(row.id, row)
        }

        // Flush checkpoint to disk after every batch
        const currentPages = allIds
          .map(r => pagesMap.get(r.id))
          .filter(Boolean)
        fs.writeFileSync(checkpointPath, JSON.stringify(currentPages), 'utf8')

        console.log(`OK (${((Date.now() - batchStart) / 1000).toFixed(1)}s)`)
        success = true
        // Pacing delay between batches to keep connection pooler healthy
        await new Promise(r => setTimeout(r, 600))
      } catch (err: any) {
        await prisma.$disconnect().catch(() => {})
        if (attempts >= 4) {
          throw new Error(`Failed to fetch batch after 4 attempts: ${err.message}`)
        }
        const waitSec = attempts * 5
        console.warn(`Retry ${attempts}/3 after error: ${err.message || err}. Waiting ${waitSec}s...`)
        await new Promise(r => setTimeout(r, waitSec * 1000))
      }
    }
  }

  // Reassemble pages in canonical order
  const pages = allIds.map(r => pagesMap.get(r.id))

  if (pages.length !== totalInDb) {
    throw new Error(
      `Row count mismatch during fetch: expected ${totalInDb}, got ${pages.length}`
    )
  }

  // 4. Calculate content integrity checksums
  console.log('[backup] Calculating record integrity checksums...')
  let totalBase64Bytes = 0
  const rowChecksums: Record<string, string> = {}

  for (const page of pages) {
    const imgLen = Buffer.byteLength(page.imagePath || '', 'utf8')
    const thumbLen = Buffer.byteLength(page.thumbnailPath || '', 'utf8')
    totalBase64Bytes += imgLen + thumbLen

    // Per-row SHA-256 hash of id + guideId + pageNumber + imagePath + thumbnailPath
    const rowHash = crypto
      .createHash('sha256')
      .update(`${page.id}:${page.guideId}:${page.pageNumber}:${page.imagePath}:${page.thumbnailPath || ''}`)
      .digest('hex')
    rowChecksums[page.id] = rowHash
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `guide_pages_backup_${timestamp}.json`
  const latestFilename = 'guide_pages_backup_latest.json'

  const filePath = path.join(backupDir, filename)
  const latestPath = path.join(backupDir, latestFilename)

  const backupPayload = {
    metadata: {
      table: 'guide_pages',
      exportedAt: new Date().toISOString(),
      totalRows: pages.length,
      totalUncompressedBytesEstimate: totalBase64Bytes,
      schemaColumns: [
        'id',
        'guideId',
        'pageNumber',
        'imagePath',
        'thumbnailPath',
        'width',
        'height',
        'fileSize',
        'createdAt',
      ],
      rowChecksums,
    },
    data: pages,
  }

  console.log('[backup] Writing backup file to disk...')
  const jsonString = JSON.stringify(backupPayload, null, 2)
  fs.writeFileSync(filePath, jsonString, 'utf8')
  fs.writeFileSync(latestPath, jsonString, 'utf8')

  // Clean up in-progress checkpoint file
  if (fs.existsSync(checkpointPath)) {
    try { fs.unlinkSync(checkpointPath) } catch {}
  }

  const fileStats = fs.statSync(filePath)
  const fileSizeMb = (fileStats.size / (1024 * 1024)).toFixed(2)
  const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2)

  console.log('\n========================================')
  console.log('   Backup Completed Successfully!       ')
  console.log('========================================')
  console.log(`- Rows Exported:        ${pages.length}`)
  console.log(`- File Size on Disk:    ${fileSizeMb} MB`)
  console.log(`- Primary Backup File:  ${filePath}`)
  console.log(`- Latest Pointer File:  ${latestPath}`)
  console.log(`- Total Time Elapsed:   ${durationSeconds}s`)
  console.log('========================================\n')
}

main()
  .catch((err) => {
    console.error('\n[backup error] Backup failed:', err.message || err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
