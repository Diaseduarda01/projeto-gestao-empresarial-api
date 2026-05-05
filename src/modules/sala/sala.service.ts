import { z } from "zod";
import { prisma } from "../../database/prisma";
import { AppError } from "../../middlewares/AppError";

export const createSalaSchema = z.object({
  nome: z.string().min(1).max(100),
  descricao: z.string().default(""),
});
export const updateSalaSchema = createSalaSchema.partial();

export const salaService = {
  list: () => prisma.sala.findMany({ orderBy: { nome: "asc" } }),

  get: async (id: string) => {
    const s = await prisma.sala.findUnique({ where: { id } });
    if (!s) throw new AppError(404, "Sala não encontrada");
    return s;
  },

  create: (data: z.infer<typeof createSalaSchema>) =>
    prisma.sala.create({ data }),

  update: async (id: string, data: z.infer<typeof updateSalaSchema>) => {
    await salaService.get(id);
    return prisma.sala.update({ where: { id }, data });
  },

  remove: async (id: string) => {
    await salaService.get(id);
    const agFuturo = await prisma.agendamento.findFirst({
      where: { salaId: id, status: "AGENDADO", horaInicio: { gte: new Date() } },
    });
    if (agFuturo) throw new AppError(409, "Sala possui agendamentos futuros e não pode ser removida");
    await prisma.sala.delete({ where: { id } });
  },
};
