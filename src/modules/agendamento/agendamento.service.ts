import { z } from "zod";
import { prisma } from "../../database/prisma";
import { AppError } from "../../middlewares/AppError";

export const createAgendamentoSchema = z.object({
  pedidoId: z.string().uuid(),
  funcionarioId: z.string().uuid(),
  salaId: z.string().uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado: YYYY-MM-DD"),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato esperado: HH:mm"),
});

const WITH_RELATIONS = {
  funcionario: { select: { id: true, nome: true } },
  sala: true,
  pedido: { include: { cliente: true, servicos: { include: { servico: true } } } },
} as const;

export const agendamentoService = {
  list: (data?: string) => {
    const where: Record<string, unknown> = {};
    if (data) where.data = new Date(`${data}T00:00:00.000Z`);
    return prisma.agendamento.findMany({
      where,
      include: WITH_RELATIONS,
      orderBy: { horaInicio: "asc" },
    });
  },

  get: async (id: string) => {
    const ag = await prisma.agendamento.findUnique({ where: { id }, include: WITH_RELATIONS });
    if (!ag) throw new AppError(404, "Agendamento não encontrado");
    return ag;
  },

  create: async (data: z.infer<typeof createAgendamentoSchema>) => {
    const pedido = await prisma.pedido.findUnique({
      where: { id: data.pedidoId },
      include: { servicos: { include: { servico: true } }, agendamento: true },
    });
    if (!pedido) throw new AppError(404, "Pedido não encontrado");
    if (pedido.agendamento) throw new AppError(409, "Pedido já possui agendamento");
    if (pedido.servicos.length === 0) throw new AppError(400, "Pedido não possui serviços");
    if (pedido.status === "CANCELADO") throw new AppError(409, "Pedido está cancelado");

    const funcionario = await prisma.funcionario.findUnique({
      where: { id: data.funcionarioId },
      include: { servicos: { select: { servicoId: true } } },
    });
    if (!funcionario) throw new AppError(404, "Funcionário não encontrado");

    const sala = await prisma.sala.findUnique({ where: { id: data.salaId } });
    if (!sala) throw new AppError(404, "Sala não encontrada");

    // Verificar que o funcionário tem especialidade em todos os serviços do pedido
    const servicosDoFuncionario = new Set(funcionario.servicos.map((fs) => fs.servicoId));
    const semEspecialidade = pedido.servicos.filter((ps) => !servicosDoFuncionario.has(ps.servicoId));
    if (semEspecialidade.length > 0) {
      const nomes = semEspecialidade.map((ps) => ps.servico.nome).join(", ");
      throw new AppError(409, `Funcionário não tem especialidade em: ${nomes}`);
    }

    const duracaoTotal = pedido.servicos.reduce((acc, ps) => acc + ps.servico.duracao, 0);
    const start = new Date(`${data.data}T${data.horaInicio}:00.000Z`);
    const end = new Date(start.getTime() + duracaoTotal * 60_000);

    // Verificação de conflito e criação dentro da mesma transaction para evitar race condition
    return prisma.$transaction(async (tx) => {
      const conflitos = await tx.agendamento.findMany({
        where: {
          status: "AGENDADO",
          OR: [{ salaId: data.salaId }, { funcionarioId: data.funcionarioId }],
          AND: [{ horaInicio: { lt: end } }, { horaFim: { gt: start } }],
        },
      });
      if (conflitos.length > 0) {
        throw new AppError(409, "Conflito de horário: sala ou funcionário já ocupados neste período");
      }

      const ag = await tx.agendamento.create({
        data: {
          pedidoId: data.pedidoId,
          funcionarioId: data.funcionarioId,
          salaId: data.salaId,
          data: new Date(`${data.data}T00:00:00.000Z`),
          horaInicio: start,
          horaFim: end,
        },
      });
      await tx.pedido.update({ where: { id: data.pedidoId }, data: { status: "AGENDADO" } });
      return ag;
    });
  },

  cancel: async (id: string) => {
    const ag = await prisma.agendamento.findUnique({ where: { id } });
    if (!ag) throw new AppError(404, "Agendamento não encontrado");
    if (ag.status !== "AGENDADO") {
      throw new AppError(409, `Agendamento com status ${ag.status} não pode ser cancelado`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.agendamento.update({ where: { id }, data: { status: "CANCELADO" } });
      await tx.pedido.update({ where: { id: ag.pedidoId }, data: { status: "CANCELADO" } });
      return updated;
    });
  },

  conclude: async (id: string) => {
    const ag = await prisma.agendamento.findUnique({ where: { id } });
    if (!ag) throw new AppError(404, "Agendamento não encontrado");
    if (ag.status !== "AGENDADO") {
      throw new AppError(409, `Agendamento com status ${ag.status} não pode ser concluído`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.agendamento.update({ where: { id }, data: { status: "CONCLUIDO" } });
      await tx.pedido.update({ where: { id: ag.pedidoId }, data: { status: "CONCLUIDO" } });
      return updated;
    });
  },
};
