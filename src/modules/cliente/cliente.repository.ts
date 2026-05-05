import { prisma } from "../../database/prisma";

export const clienteRepository = {
  create: (data: { nome: string; telefone: string; email: string }) =>
    prisma.cliente.create({ data }),
  findAll: () => prisma.cliente.findMany({ orderBy: { createdAt: "desc" } }),
  findById: (id: string) => prisma.cliente.findUnique({ where: { id } }),
  update: (id: string, data: Partial<{ nome: string; telefone: string; email: string }>) =>
    prisma.cliente.update({ where: { id }, data }),
  delete: (id: string) => prisma.cliente.delete({ where: { id } }),
};
