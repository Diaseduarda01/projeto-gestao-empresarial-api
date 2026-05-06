import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';

@Injectable()
export class ServicoRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findAll() {
    return this.prisma.servico.findMany({ orderBy: { nome: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.servico.findUnique({ where: { id } });
  }

  create(data: CreateServicoDto) {
    return this.prisma.servico.create({ data });
  }

  update(id: string, data: UpdateServicoDto) {
    return this.prisma.servico.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.servico.delete({ where: { id } });
  }

  findPedidoServico(servicoId: string) {
    return this.prisma.pedidoServico.findFirst({ where: { servicoId } });
  }
}
