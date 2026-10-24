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
      process.env[match[1]] = value.trim();
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.adminUser.findMany();
  console.log('Admins count:', users.length);
  for (const u of users) {
    console.log(`- Email: ${u.email}, Name: ${u.name}, Role: ${u.role}, Active: ${u.isActive}, Created: ${u.createdAt}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
