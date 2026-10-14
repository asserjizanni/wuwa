const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  const env = fs.readFileSync(envFile, 'utf8');
  env.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const chars = await prisma.character.findMany({
      include: {
        guides: {
          where: { status: 'PUBLISHED', isActive: true },
          select: { id: true, title: true, version: true, pageCount: true, publishedAt: true }
        }
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
    });

    console.log('Fetched characters:', chars.length);
    const jsonStr = JSON.stringify(chars, null, 2);
    console.log('JSON size:', (Buffer.byteLength(jsonStr) / 1024 / 1024).toFixed(2), 'MB');

    const outPath = path.join(__dirname, '..', 'storage', 'data', 'characters.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, jsonStr, 'utf8');
    console.log('Wrote to', outPath);
  } catch (err) {
    console.error('Error syncing characters:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
