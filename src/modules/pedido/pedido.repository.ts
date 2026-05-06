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

  findAll() {
    return this.prisma.pedido.findMany({
      include: WITH_RELATIONS,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.pedido.findUnique({ where: { id }, include: WITH_RELATIONS });
  }

  findClienteById(clienteId: string) {
    return this.prisma.cliente.findUnique({ where: { id: clienteId } });
  }

  findServicosByIds(ids: string[]) {
    return this.prisma.servico.findMany({ where: { id: { in: ids } } });
  }

  create(clienteId: string, servicoIds: string[]) {
    return this.prisma.pedido.create({
      data: {
        clienteId,
        servicos: { create: servicoIds.map((servicoId) => ({ servicoId })) },
      },
      include: WITH_RELATIONS,
    });
  }

  findPedidoRaw(id: string) {
    return this.prisma.pedido.findUnique({ where: { id } });
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
