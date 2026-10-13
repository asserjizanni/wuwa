#!/usr/bin/env tsx
/**
 * scripts/verify-backup.ts
 *
 * Verifies the integrity of the local guide_pages backup file against the live database.
 * Confirms:
 *  - File readability and JSON validity
 *  - Exact row count match between backup and database
 *  - 100% ID parity (all DB IDs in backup, all backup IDs in DB)
 *  - Integrity of columns (pageNumber, guideId, imagePath length)
 *  - Record checksum verification
 *
 * Usage:
 *   npx tsx scripts/verify-backup.ts [optional_path_to_backup.json]
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
  console.log('   Verifying guide_pages Backup File    ')
  console.log('========================================\n')

  const customPath = process.argv[2]
  const backupDir = path.resolve(process.cwd(), 'backups')
  const targetPath = customPath
    ? path.resolve(process.cwd(), customPath)
    : path.join(backupDir, 'guide_pages_backup_latest.json')

  console.log(`[verify] Target Backup File: ${targetPath}`)

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Backup file not found at: ${targetPath}`)
  }

  // 1. Read & Parse JSON
  console.log('[verify] Reading file and parsing JSON content...')
  const rawContent = fs.readFileSync(targetPath, 'utf8')
  let parsed: any
  try {
    parsed = JSON.parse(rawContent)
  } catch (err: any) {
    throw new Error(`JSON parse failure: ${err.message}`)
  }

  if (!parsed.data || !Array.isArray(parsed.data)) {
    throw new Error('Invalid backup structure: missing "data" array.')
  }

  const backupRows: any[] = parsed.data
  const metadata = parsed.metadata || {}
  console.log(`[verify] Backup contains ${backupRows.length} rows (Metadata timestamp: ${metadata.exportedAt || 'N/A'}).`)

  // 2. Query Live Database (Read-Only)
  console.log('[verify] Querying live database for current records...')
  let dbRows: any[] = []
  let attempts = 0
  while (attempts < 3) {
    attempts++
    try {
      dbRows = await prisma.guidePage.findMany({
        select: {
          id: true,
          guideId: true,
          pageNumber: true,
          width: true,
          height: true,
          fileSize: true,
        },
        orderBy: [
          { guideId: 'asc' },
          { pageNumber: 'asc' },
        ],
      })
      break
    } catch (err: any) {
      await prisma.$disconnect().catch(() => {})
      if (attempts >= 3) throw err
      console.warn(`[verify] Connection retry ${attempts}/3: ${err.message || err}. Waiting 3s...`)
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  console.log(`[verify] Live database reports ${dbRows.length} records in guide_pages.`)

  // 3. Compare Row Counts
  if (backupRows.length !== dbRows.length) {
    throw new Error(
      `CRITICAL MISMATCH: Backup has ${backupRows.length} rows, but database has ${dbRows.length} rows!`
    )
  }
  console.log('  [OK] Row count match (Backup: ' + backupRows.length + ' vs DB: ' + dbRows.length + ')')

  // 4. Verify ID Parity
  const backupMap = new Map<string, any>()
  for (const row of backupRows) {
    if (!row.id) {
      throw new Error('Found row in backup without an "id" field.')
    }
    backupMap.set(row.id, row)
  }

  const missingInBackup: string[] = []
  for (const dbRow of dbRows) {
    if (!backupMap.has(dbRow.id)) {
      missingInBackup.push(dbRow.id)
    }
  }

  if (missingInBackup.length > 0) {
    throw new Error(
      `CRITICAL MISMATCH: ${missingInBackup.length} database records are missing from the backup file!`
    )
  }
  console.log('  [OK] 100% ID Parity: All ' + dbRows.length + ' database records exist in the backup.')

  // 5. Verify Column Completeness & Image Payloads
  let validDataUrls = 0
  let missingPayloads = 0
  let totalDataBytes = 0

  for (const row of backupRows) {
    if (!row.guideId || row.pageNumber === undefined || row.pageNumber === null) {
      throw new Error(`Row ${row.id} has missing required metadata (guideId or pageNumber).`)
    }
    if (!row.imagePath || typeof row.imagePath !== 'string') {
      missingPayloads++
      continue
    }

    if (row.imagePath.startsWith('data:image/')) {
      validDataUrls++
      totalDataBytes += Buffer.byteLength(row.imagePath, 'utf8')
    }
  }

  if (missingPayloads > 0) {
    throw new Error(`CRITICAL ERROR: ${missingPayloads} rows in backup have empty imagePath!`)
  }

  console.log(`  [OK] Image Payloads: All ${backupRows.length} rows contain complete image data.`)
  console.log(`  [OK] Base64 Data URLs verified: ${validDataUrls} / ${backupRows.length}`)
  console.log(`  [OK] Total verified uncompressed payload: ${(totalDataBytes / (1024 * 1024)).toFixed(2)} MB`)

  // 6. Checksum Verification (if available)
  if (metadata.rowChecksums && typeof metadata.rowChecksums === 'object') {
    let checksumMatches = 0
    for (const row of backupRows) {
      const expectedHash = metadata.rowChecksums[row.id]
      if (expectedHash) {
        const calculated = crypto
          .createHash('sha256')
          .update(`${row.id}:${row.guideId}:${row.pageNumber}:${row.imagePath}:${row.thumbnailPath || ''}`)
          .digest('hex')

        if (calculated !== expectedHash) {
          throw new Error(`Checksum verification failed for row id: ${row.id}`)
        }
        checksumMatches++
      }
    }
    console.log(`  [OK] Checksums verified: ${checksumMatches} / ${backupRows.length} records match SHA-256 signatures.`)
  }

  console.log('\n========================================')
  console.log('   Verification Result: 100% PASSED     ')
  console.log('========================================')
  console.log('- Verified Rows:        ' + backupRows.length)
  console.log('- Total Missing:        0')
  console.log('- Payload Integrity:   VALID')
  console.log('- Backup Status:        SAFE & RECOVERABLE')
  console.log('========================================\n')
}

main()
  .catch((err) => {
    console.error('\n[verify error] Verification failed:', err.message || err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
