import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash("admin123", 10);

  const empresa = await prisma.empresa.upsert({
    where: { slug: "empresa-padrao" },
    update: { nome: "Empresa Padrão" },
    create: { id: "00000000-0000-0000-0000-000000000001", nome: "Empresa Padrão", slug: "empresa-padrao" },
  });

  const admin = await prisma.funcionario.upsert({
    where: { email: "admin@admin.com" },
    update: {},
    create: { nome: "Admin", email: "admin@admin.com", senha },
  });

  await prisma.funcionarioEmpresa.upsert({
    where: { funcionarioId_empresaId: { funcionarioId: admin.id, empresaId: empresa.id } },
    update: { papel: "ADMIN" },
    create: { funcionarioId: admin.id, empresaId: empresa.id, papel: "ADMIN" },
  });

  console.log(`Seed OK -> admin@admin.com / admin123 | empresa: ${empresa.nome} (${empresa.slug})`);
}

main().finally(() => prisma.$disconnect());
