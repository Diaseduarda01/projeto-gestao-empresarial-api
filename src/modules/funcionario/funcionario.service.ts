import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../database/prisma";
import { AppError } from "../../middlewares/AppError";

export const createFuncSchema = z.object({
  nome: z.string().min(1).max(120),
  email: z.string().email(),
  senha: z.string().min(6).max(100),
});
export const updateFuncSchema = createFuncSchema.partial();

const PUBLIC_FIELDS = { id: true, nome: true, email: true, createdAt: true } as const;

export const funcionarioService = {
  list: () =>
    prisma.funcionario.findMany({
      select: PUBLIC_FIELDS,
      orderBy: { nome: "asc" },
    }),

  get: async (id: string) => {
    const f = await prisma.funcionario.findUnique({ where: { id }, select: PUBLIC_FIELDS });
    if (!f) throw new AppError(404, "Funcionário não encontrado");
    return f;
  },

  create: async (data: z.infer<typeof createFuncSchema>) => {
    const senha = await bcrypt.hash(data.senha, 10);
    const f = await prisma.funcionario.create({ data: { ...data, senha } });
    return { id: f.id, nome: f.nome, email: f.email, createdAt: f.createdAt };
  },

  update: async (id: string, data: z.infer<typeof updateFuncSchema>) => {
    await funcionarioService.get(id);
    const payload: z.infer<typeof updateFuncSchema> & { senha?: string } = { ...data };
    if (data.senha) payload.senha = await bcrypt.hash(data.senha, 10);
    const f = await prisma.funcionario.update({ where: { id }, data: payload });
    return { id: f.id, nome: f.nome, email: f.email, createdAt: f.createdAt };
  },

  remove: async (id: string) => {
    await funcionarioService.get(id);
    const agFuturo = await prisma.agendamento.findFirst({
      where: { funcionarioId: id, status: "AGENDADO", horaInicio: { gte: new Date() } },
    });
    if (agFuturo) throw new AppError(409, "Funcionário possui agendamentos futuros e não pode ser removido");
    await prisma.funcionario.delete({ where: { id } });
  },

  listServicos: (id: string) =>
    prisma.funcionarioServico.findMany({
      where: { funcionarioId: id },
      include: { servico: true },
    }),

  addServicos: async (id: string, servicoIds: string[]) => {
    await funcionarioService.get(id);
    const servicos = await prisma.servico.findMany({ where: { id: { in: servicoIds } } });
    if (servicos.length !== servicoIds.length) {
      throw new AppError(404, "Um ou mais serviços não encontrados");
    }
    await prisma.funcionarioServico.createMany({
      data: servicoIds.map((servicoId) => ({ funcionarioId: id, servicoId })),
      skipDuplicates: true,
    });
    return funcionarioService.listServicos(id);
  },

  removeServico: async (id: string, servicoId: string) => {
    await funcionarioService.get(id);
    await prisma.funcionarioServico.delete({
      where: { funcionarioId_servicoId: { funcionarioId: id, servicoId } },
    });
  },
};
