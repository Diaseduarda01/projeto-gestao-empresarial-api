import { z } from "zod";
import { prisma } from "../../database/prisma";
import { AppError } from "../../middlewares/AppError";

export const createServicoSchema = z.object({
  nome: z.string().min(1).max(100),
  descricao: z.string().default(""),
  duracao: z.number().int().positive(),
  preco: z.number().nonnegative(),
});
export const updateServicoSchema = createServicoSchema.partial();

export const servicoService = {
  list: () => prisma.servico.findMany({ orderBy: { nome: "asc" } }),

  get: async (id: string) => {
    const s = await prisma.servico.findUnique({ where: { id } });
    if (!s) throw new AppError(404, "Serviço não encontrado");
    return s;
  },

  create: (data: z.infer<typeof createServicoSchema>) =>
    prisma.servico.create({ data }),

  update: async (id: string, data: z.infer<typeof updateServicoSchema>) => {
    await servicoService.get(id);
    return prisma.servico.update({ where: { id }, data });
  },

  remove: async (id: string) => {
    await servicoService.get(id);
    const emUso = await prisma.pedidoServico.findFirst({ where: { servicoId: id } });
    if (emUso) throw new AppError(409, "Serviço está vinculado a pedidos e não pode ser removido");
    await prisma.servico.delete({ where: { id } });
  },
};
