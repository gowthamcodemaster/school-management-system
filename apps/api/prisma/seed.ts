// apps/api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Super Admin ────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin@123456', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@vidyadhara.com' },
    update: {},
    create: {
      email: 'superadmin@vidyadhara.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
    },
  });

  console.log(`✅ Super Admin created: ${superAdmin.email}`);
  console.log(`   Password: Admin@123456`);
  console.log(`   Role: ${superAdmin.role}`);
  console.log('');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
