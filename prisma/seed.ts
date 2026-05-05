import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash("admin123", 10);
  await prisma.funcionario.upsert({
    where: { email: "admin@admin.com" },
    update: {},
    create: { nome: "Admin", email: "admin@admin.com", senha },
  });
  console.log("Seed OK -> admin@admin.com / admin123");
}

main().finally(() => prisma.$disconnect());
