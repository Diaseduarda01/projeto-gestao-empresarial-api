import request from "supertest";
import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma";
import { app } from "../../app";

export const ADMIN = {
  nome: "Admin Teste",
  email: "admin@test.com",
  senha: "admin123",
};

export async function createAdmin() {
  return prisma.funcionario.upsert({
    where: { email: ADMIN.email },
    update: {},
    create: { ...ADMIN, senha: await bcrypt.hash(ADMIN.senha, 10) },
  });
}

export async function getToken(): Promise<string> {
  await createAdmin();
  const res = await request(app)
    .post("/auth/login")
    .send({ email: ADMIN.email, senha: ADMIN.senha });
  return res.body.token as string;
}
