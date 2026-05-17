import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';

@Injectable()
export class ServicoRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.servico.findMany({
      where: { empresaId, deletedAt: null },
      orderBy: { nome: 'asc' },
    });
  }

  findById(id: string, empresaId: string) {
    return this.prisma.servico.findFirst({ where: { id, empresaId, deletedAt: null } });
  }

  create(data: CreateServicoDto, empresaId: string) {
    return this.prisma.servico.create({ data: { ...data, empresaId } });
  }

  update(id: string, data: UpdateServicoDto) {
    return this.prisma.servico.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.servico.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  findPedidoServico(servicoId: string, empresaId: string) {
    return this.prisma.pedidoServico.findFirst({
      where: { servicoId, pedido: { empresaId } },
    });
  }
}
