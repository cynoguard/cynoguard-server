import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";


const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_PROD_URL!,
  // ssl: {
  //   rejectUnauthorized: true,
  //   ca: readFileSync('/home/ubuntu/rds-ca.pem').toString(),
  // }
});

export const prisma = new PrismaClient({ adapter });



async function main() {
  console.log("🌱 Seeding test data...\n");

  // 1. User
  const user = await prisma.user.upsert({
    where: { id: "test-user-001" },
    update: {},
    create: {
      id: "test-user-001",
      firebaseId: "test-firebase-001",
      email: "test@cynoguard.io",
      firstName: "Test",
      lastName: "User",
    },
  });
  console.log("✅ User:", user.id);

  // 2. Organization
  const org = await prisma.organization.upsert({
    where: { name: "Test Organization" },
    update: {},
    create: {
      id: "test-org-001",
      name: "Test Organization",
      isOnboarded: true,
    },
  });
  console.log("✅ Organization:", org.id);

  // 3. OrganizationMember
  const member = await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: {},
    create: {
      id: "test-member-001",
      organizationId: org.id,
      userId: user.id,
      role: "OWNER",
    },
  });
  console.log("✅ OrganizationMember:", member.id);

  // 4. Project
  const project = await prisma.project.upsert({
    where: { name_organizationId: { name: "Test Project", organizationId: org.id } },
    update: {},
    create: {
      id: "test-project-001",
      organizationId: org.id,
      name: "Test Project",
      primary_domain: "cynoguard.io",
      environment: "development",
      status: "active",
      createdAt: new Date(),
    },
  });
  console.log("✅ Project:", project.id);

  console.log("\n🎉 Done! Test data ready.");
  console.log("\nUse these in your curl commands:");
  console.log("  PROJECT_ID = test-project-001");
  console.log("  USER_ID    = test-user-001");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());


