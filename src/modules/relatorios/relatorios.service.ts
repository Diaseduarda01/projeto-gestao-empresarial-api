import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RelatoriosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async agendamentosPorPeriodo(
    empresaId: string,
    inicio: string,
    fim: string,
    status?: string,
    funcionarioId?: string,
  ) {
    const inicioDate = new Date(`${inicio}T00:00:00.000Z`);
    const fimDate = new Date(`${fim}T23:59:59.999Z`);
    const where: any = {
      empresaId,
      data: { gte: inicioDate, lte: fimDate },
      ...(status ? { status } : {}),
      ...(funcionarioId ? { funcionarioId } : {}),
    };

    const [agendamentos, total] = await Promise.all([
      this.prisma.agendamento.findMany({
        where,
        include: {
          funcionario: { select: { id: true, nome: true } },
          pedido: {
            include: {
              cliente: { select: { id: true, nome: true } },
              servicos: { include: { servico: { select: { nome: true } } } },
            },
          },
        },
        orderBy: { horaInicio: 'asc' },
      }),
      this.prisma.agendamento.count({ where }),
    ]);

    const porStatus = agendamentos.reduce(
      (acc, ag) => { acc[ag.status] = (acc[ag.status] ?? 0) + 1; return acc; },
      {} as Record<string, number>,
    );

    return {
      periodo: { inicio, fim },
      total,
      porStatus,
      agendamentos: agendamentos.map((ag) => ({
        id: ag.id,
        data: ag.data.toISOString().substring(0, 10),
        horaInicio: ag.horaInicio.toISOString().substring(11, 16),
        status: ag.status,
        funcionario: ag.funcionario.nome,
        cliente: ag.pedido.cliente.nome,
        servicos: ag.pedido.servicos.map((ps) => ps.servico.nome).join(', '),
      })),
    };
  }

  async taxaCancelamento(empresaId: string, inicio: string, fim: string) {
    const inicioDate = new Date(`${inicio}T00:00:00.000Z`);
    const fimDate = new Date(`${fim}T23:59:59.999Z`);
    const where = { empresaId, data: { gte: inicioDate, lte: fimDate } };

    const [total, cancelados, concluidos] = await Promise.all([
      this.prisma.agendamento.count({ where }),
      this.prisma.agendamento.count({ where: { ...where, status: 'CANCELADO' } }),
      this.prisma.agendamento.count({ where: { ...where, status: 'CONCLUIDO' } }),
    ]);

    return {
      periodo: { inicio, fim },
      total,
      cancelados,
      concluidos,
      agendados: total - cancelados - concluidos,
      taxaCancelamento: total > 0 ? Number(((cancelados / total) * 100).toFixed(1)) : 0,
      taxaConclusao: total > 0 ? Number(((concluidos / total) * 100).toFixed(1)) : 0,
    };
  }

  async clientesNovosVsRecorrentes(empresaId: string, inicio: string, fim: string) {
    const inicioDate = new Date(`${inicio}T00:00:00.000Z`);
    const fimDate = new Date(`${fim}T23:59:59.999Z`);

    // Clientes com primeiro agendamento no período = novos
    const clientesNoPeriodo = await this.prisma.agendamento.findMany({
      where: { empresaId, data: { gte: inicioDate, lte: fimDate }, status: { not: 'CANCELADO' } },
      include: { pedido: { select: { clienteId: true } } },
      distinct: ['pedidoId'],
    });

    const clienteIds = [...new Set(clientesNoPeriodo.map((ag) => ag.pedido.clienteId))];

    let novos = 0;
    let recorrentes = 0;

    for (const clienteId of clienteIds) {
      const primeiroAgendamento = await this.prisma.agendamento.findFirst({
        where: {
          empresaId,
          status: { not: 'CANCELADO' },
          pedido: { clienteId },
        },
        orderBy: { data: 'asc' },
        select: { data: true },
      });

      if (primeiroAgendamento && primeiroAgendamento.data >= inicioDate) {
        novos += 1;
      } else {
        recorrentes += 1;
      }
    }

    return {
      periodo: { inicio, fim },
      totalClientes: clienteIds.length,
      novos,
      recorrentes,
      percentualNovos: clienteIds.length > 0 ? Number(((novos / clienteIds.length) * 100).toFixed(1)) : 0,
    };
  }

  async exportarAgendamentosCSV(
    empresaId: string,
    inicio: string,
    fim: string,
  ): Promise<string> {
    const { agendamentos } = await this.agendamentosPorPeriodo(empresaId, inicio, fim);

    const headers = ['id', 'data', 'horaInicio', 'status', 'funcionario', 'cliente', 'servicos'];
    const rows = agendamentos.map((ag) =>
      [ag.id, ag.data, ag.horaInicio, ag.status, `"${ag.funcionario}"`, `"${ag.cliente}"`, `"${ag.servicos}"`].join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
