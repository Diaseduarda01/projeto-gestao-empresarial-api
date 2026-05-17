import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ClienteRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  create(data: { nome: string; telefone: string; email: string }, empresaId: string) {
    return this.prisma.cliente.create({ data: { ...data, empresaId } });
  }

  async findAll(empresaId: string, skip: number, take: number) {
    const where = { empresaId, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.cliente.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.cliente.count({ where }),
    ]);
    return { data, total };
  }

  findById(id: string, empresaId: string) {
    return this.prisma.cliente.findFirst({ where: { id, empresaId, deletedAt: null } });
  }

  update(id: string, data: Partial<{ nome: string; telefone: string; email: string }>) {
    return this.prisma.cliente.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.cliente.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
