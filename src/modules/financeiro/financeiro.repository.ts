import { Injectable, Inject } from '@nestjs/common';
import { FormaPagamento, PagamentoStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FinanceiroRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  create(empresaId: string, data: {
    agendamentoId?: string;
    clienteId: string;
    valor: number;
    desconto?: number;
    formaPagamento: FormaPagamento;
    observacoes?: string;
  }) {
    return this.prisma.pagamento.create({
      data: { ...data, empresaId },
      include: { cliente: { select: { id: true, nome: true } }, agendamento: true },
    });
  }

  findAll(empresaId: string, filters: { status?: PagamentoStatus; data?: string }) {
    const where: any = { empresaId };
    if (filters.status) where.status = filters.status;
    if (filters.data) {
      const d = new Date(filters.data);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.criadoEm = { gte: d, lt: next };
    }
    return this.prisma.pagamento.findMany({
      where,
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  findById(id: string, empresaId: string) {
    return this.prisma.pagamento.findFirst({
      where: { id, empresaId },
      include: {
        cliente: { select: { id: true, nome: true, telefone: true } },
        agendamento: true,
      },
    });
  }

  updateStatus(id: string, empresaId: string, status: PagamentoStatus, pagoEm?: Date) {
    return this.prisma.pagamento.update({
      where: { id },
      data: { status, ...(pagoEm ? { pagoEm } : {}) },
    });
  }

  caixaDia(empresaId: string, data: string) {
    const d = new Date(data);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return this.prisma.pagamento.findMany({
      where: {
        empresaId,
        status: 'CONFIRMADO',
        pagoEm: { gte: d, lt: next },
      },
      select: {
        valor: true,
        desconto: true,
        formaPagamento: true,
      },
    });
  }

  relatorio(empresaId: string, inicio: Date, fim: Date) {
    return this.prisma.pagamento.findMany({
      where: { empresaId, status: 'CONFIRMADO', pagoEm: { gte: inicio, lte: fim } },
      include: {
        cliente: { select: { id: true, nome: true } },
        agendamento: {
          include: {
            funcionario: { select: { id: true, nome: true } },
            pedido: {
              include: {
                servicos: { include: { servico: { select: { id: true, nome: true, preco: true } } } },
              },
            },
          },
        },
      },
      orderBy: { pagoEm: 'asc' },
    });
  }

  comissoesAgendamentos(empresaId: string, funcionarioId: string, inicio: Date, fim: Date) {
    return this.prisma.agendamento.findMany({
      where: {
        empresaId,
        funcionarioId,
        status: 'CONCLUIDO',
        data: { gte: inicio, lte: fim },
      },
      include: {
        pedido: {
          include: {
            servicos: { include: { servico: { select: { id: true, nome: true, preco: true } } } },
          },
        },
      },
    });
  }

  comissoesRegras(empresaId: string, funcionarioId: string) {
    return this.prisma.comissaoFuncionario.findMany({
      where: { empresaId, funcionarioId },
    });
  }
}
