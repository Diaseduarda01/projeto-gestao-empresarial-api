import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ComissaoRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  upsert(empresaId: string, data: {
    funcionarioId: string;
    servicoId?: string | null;
    percentual: number;
  }) {
    return this.prisma.comissaoFuncionario.upsert({
      where: {
        funcionarioId_empresaId_servicoId: {
          funcionarioId: data.funcionarioId,
          empresaId,
          // Prisma compound unique: null is valid but TS type omits it
          servicoId: (data.servicoId ?? null) as string,
        },
      },
      update: { percentual: data.percentual },
      create: { ...data, empresaId },
      include: {
        funcionario: { select: { id: true, nome: true } },
        servico: { select: { id: true, nome: true } },
      },
    });
  }

  findAll(empresaId: string, funcionarioId?: string) {
    return this.prisma.comissaoFuncionario.findMany({
      where: { empresaId, ...(funcionarioId ? { funcionarioId } : {}) },
      include: {
        funcionario: { select: { id: true, nome: true } },
        servico: { select: { id: true, nome: true } },
      },
      orderBy: [{ funcionario: { nome: 'asc' } }, { servico: { nome: 'asc' } }],
    });
  }

  findById(id: string, empresaId: string) {
    return this.prisma.comissaoFuncionario.findFirst({ where: { id, empresaId } });
  }

  delete(id: string) {
    return this.prisma.comissaoFuncionario.delete({ where: { id } });
  }

  relatorioMes(empresaId: string, funcionarioId: string, mes: string) {
    // mes no formato YYYY-MM
    const inicio = new Date(`${mes}-01`);
    const fim = new Date(inicio);
    fim.setMonth(fim.getMonth() + 1);

    return this.prisma.agendamento.findMany({
      where: {
        empresaId,
        funcionarioId,
        status: 'CONCLUIDO',
        data: { gte: inicio, lt: fim },
      },
      include: {
        pedido: {
          include: {
            servicos: {
              include: { servico: { select: { id: true, nome: true, preco: true } } },
            },
          },
        },
      },
    });
  }
}
