import { z } from "zod";
import { prisma } from "../../database/prisma";
import { AppError } from "../../middlewares/AppError";

export const createPedidoSchema = z.object({
  clienteId: z.string().uuid(),
  servicoIds: z.array(z.string().uuid()).min(1),
});

export const addServicosSchema = z.object({
  servicoIds: z.array(z.string().uuid()).min(1),
});

const WITH_RELATIONS = {
  cliente: true,
  servicos: { include: { servico: true } },
  agendamento: true,
} as const;

export const pedidoService = {
  list: () =>
    prisma.pedido.findMany({
      include: WITH_RELATIONS,
      orderBy: { createdAt: "desc" },
    }),

  get: async (id: string) => {
    const p = await prisma.pedido.findUnique({ where: { id }, include: WITH_RELATIONS });
    if (!p) throw new AppError(404, "Pedido não encontrado");
    return p;
  },

  create: async (data: z.infer<typeof createPedidoSchema>) => {
    const cliente = await prisma.cliente.findUnique({ where: { id: data.clienteId } });
    if (!cliente) throw new AppError(404, "Cliente não encontrado");

    const servicos = await prisma.servico.findMany({ where: { id: { in: data.servicoIds } } });
    if (servicos.length !== data.servicoIds.length) {
      throw new AppError(404, "Um ou mais serviços não encontrados");
    }

    return prisma.pedido.create({
      data: {
        clienteId: data.clienteId,
        servicos: { create: data.servicoIds.map((servicoId) => ({ servicoId })) },
      },
      include: WITH_RELATIONS,
    });
  },

  addServicos: async (id: string, servicoIds: string[]) => {
    const pedido = await prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new AppError(404, "Pedido não encontrado");
    if (pedido.status !== "ABERTO") {
      throw new AppError(409, `Não é possível adicionar serviços a um pedido com status ${pedido.status}`);
    }

    const servicos = await prisma.servico.findMany({ where: { id: { in: servicoIds } } });
    if (servicos.length !== servicoIds.length) {
      throw new AppError(404, "Um ou mais serviços não encontrados");
    }

    await prisma.pedidoServico.createMany({
      data: servicoIds.map((servicoId) => ({ pedidoId: id, servicoId })),
      skipDuplicates: true,
    });

    return prisma.pedido.findUnique({ where: { id }, include: WITH_RELATIONS });
  },

  cancel: async (id: string) => {
    const pedido = await prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new AppError(404, "Pedido não encontrado");
    if (pedido.status === "CANCELADO") throw new AppError(409, "Pedido já está cancelado");
    if (pedido.status === "CONCLUIDO") throw new AppError(409, "Pedido concluído não pode ser cancelado");

    return prisma.pedido.update({ where: { id }, data: { status: "CANCELADO" } });
  },
};
