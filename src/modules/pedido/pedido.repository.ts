import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const WITH_RELATIONS = {
  cliente: true,
  servicos: { include: { servico: true } },
  agendamento: true,
} as const;

@Injectable()
export class PedidoRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(empresaId: string, skip: number, take: number) {
    const [data, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where: { empresaId },
        include: WITH_RELATIONS,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.pedido.count({ where: { empresaId } }),
    ]);
    return { data, total };
  }

  findById(id: string, empresaId: string) {
    return this.prisma.pedido.findFirst({ where: { id, empresaId }, include: WITH_RELATIONS });
  }

  findClienteById(clienteId: string, empresaId: string) {
    return this.prisma.cliente.findFirst({ where: { id: clienteId, empresaId } });
  }

  findServicosByIds(ids: string[], empresaId: string) {
    return this.prisma.servico.findMany({ where: { id: { in: ids }, empresaId } });
  }

  create(clienteId: string, servicoIds: string[], empresaId: string) {
    return this.prisma.pedido.create({
      data: {
        clienteId,
        empresaId,
        servicos: { create: servicoIds.map((servicoId) => ({ servicoId })) },
      },
      include: WITH_RELATIONS,
    });
  }

  findPedidoRaw(id: string, empresaId: string) {
    return this.prisma.pedido.findFirst({ where: { id, empresaId } });
  }

  addServicos(pedidoId: string, servicoIds: string[]) {
    return this.prisma.pedidoServico.createMany({
      data: servicoIds.map((servicoId) => ({ pedidoId, servicoId })),
      skipDuplicates: true,
    });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.pedido.update({ where: { id }, data: { status: status as any } });
  }
}
