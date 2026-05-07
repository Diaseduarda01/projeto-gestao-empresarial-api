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

  async findAll(empresaId: string, skip: number, take: number, data?: Date) {
    const where = { empresaId, ...(data ? { data } : {}) };
    const [result, total] = await Promise.all([
      this.prisma.agendamento.findMany({ where, include: WITH_RELATIONS, orderBy: { horaInicio: 'asc' }, skip, take }),
      this.prisma.agendamento.count({ where }),
    ]);
    return { data: result, total };
  }

  findById(id: string, empresaId: string) {
    return this.prisma.agendamento.findFirst({ where: { id, empresaId }, include: WITH_RELATIONS });
  }

  findPedidoWithServicosAndAgendamento(pedidoId: string, empresaId: string) {
    return this.prisma.pedido.findFirst({
      where: { id: pedidoId, empresaId },
      include: { servicos: { include: { servico: true } }, agendamento: true },
    });
  }

  findFuncionarioWithServicos(funcionarioId: string, empresaId: string) {
    return this.prisma.funcionarioEmpresa.findUnique({
      where: { funcionarioId_empresaId: { funcionarioId, empresaId } },
      include: {
        funcionario: { include: { servicos: { select: { servicoId: true } } } },
      },
    });
  }

  findSalaById(salaId: string, empresaId: string) {
    return this.prisma.sala.findFirst({ where: { id: salaId, empresaId } });
  }

  findAgendamentoRaw(id: string, empresaId: string) {
    return this.prisma.agendamento.findFirst({ where: { id, empresaId } });
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
      empresaId: string;
      data: Date;
      horaInicio: Date;
      horaFim: Date;
    },
  ) {
    return tx.agendamento.create({ data: params });
  }

  findConflitos(
    tx: any,
    params: { salaId: string; funcionarioId: string; empresaId: string; start: Date; end: Date },
  ) {
    return tx.agendamento.findMany({
      where: {
        empresaId: params.empresaId,
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
