import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  const backupPath = path.join(process.cwd(), 'backups', 'database_full_backup_latest.json');
  if (!fs.existsSync(backupPath)) return;

  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  const pages = backupData?.tables?.guidePages || [];
  console.log(`Migrating remaining guide pages... Total in backup: ${pages.length}`);

  const formatted = pages.map((p: any) => ({
    id: p.id,
    guideId: p.guideId,
    pageNumber: p.pageNumber,
    imagePath: p.imagePath,
    thumbnailPath: p.thumbnailPath || null,
    width: p.width || null,
    height: p.height || null,
    fileSize: p.fileSize || 0,
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
  }));

  // Batch in chunks of 25 to respect Postgres parameter limits with large base64 strings
  const chunkSize = 25;
  let totalInserted = 0;
  for (let i = 0; i < formatted.length; i += chunkSize) {
    const chunk = formatted.slice(i, i + chunkSize);
    const res = await prisma.guidePage.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    totalInserted += res.count;
    console.log(`Chunk ${Math.floor(i / chunkSize) + 1}: +${res.count} pages (running total inserted: ${totalInserted})`);
  }

  const finalCount = await prisma.guidePage.count();
  console.log(`All guide pages now in database: ${finalCount}/${pages.length}`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
