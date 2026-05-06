import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const WITH_RELATIONS = {
  funcionario: { select: { id: true, nome: true } },
  sala: true,
  pedido: { include: { cliente: true, servicos: { include: { servico: true } } } },
} as const;

@Injectable()
export class AgendamentoRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findAll(data?: Date) {
    const where: Record<string, unknown> = {};
    if (data) where.data = data;
    return this.prisma.agendamento.findMany({
      where,
      include: WITH_RELATIONS,
      orderBy: { horaInicio: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.agendamento.findUnique({ where: { id }, include: WITH_RELATIONS });
  }

  findPedidoWithServicosAndAgendamento(pedidoId: string) {
    return this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { servicos: { include: { servico: true } }, agendamento: true },
    });
  }

  findFuncionarioWithServicos(funcionarioId: string) {
    return this.prisma.funcionario.findUnique({
      where: { id: funcionarioId },
      include: { servicos: { select: { servicoId: true } } },
    });
  }

  findSalaById(salaId: string) {
    return this.prisma.sala.findUnique({ where: { id: salaId } });
  }

  findAgendamentoRaw(id: string) {
    return this.prisma.agendamento.findUnique({ where: { id } });
  }

  $transaction<T>(fn: (tx: PrismaService) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn as any) as Promise<T>;
  }

  createAgendamento(
    tx: any,
    params: {
      pedidoId: string;
      funcionarioId: string;
      salaId: string;
      data: Date;
      horaInicio: Date;
      horaFim: Date;
    },
  ) {
    return tx.agendamento.create({ data: params });
  }

  findConflitos(
    tx: any,
    params: {
      salaId: string;
      funcionarioId: string;
      start: Date;
      end: Date;
    },
  ) {
    return tx.agendamento.findMany({
      where: {
        status: 'AGENDADO',
        OR: [{ salaId: params.salaId }, { funcionarioId: params.funcionarioId }],
        AND: [{ horaInicio: { lt: params.end } }, { horaFim: { gt: params.start } }],
      },
    });
  }

  updatePedidoStatus(tx: any, pedidoId: string, status: string) {
    return tx.pedido.update({ where: { id: pedidoId }, data: { status } });
  }

  updateAgendamentoStatus(tx: any, id: string, status: string) {
    return tx.agendamento.update({ where: { id }, data: { status } });
  }
}
