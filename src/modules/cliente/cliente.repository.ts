import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ClienteRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  create(data: { nome: string; telefone: string; email: string }) {
    return this.prisma.cliente.create({ data });
  }

  findAll() {
    return this.prisma.cliente.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findById(id: string) {
    return this.prisma.cliente.findUnique({ where: { id } });
  }

  update(id: string, data: Partial<{ nome: string; telefone: string; email: string }>) {
    return this.prisma.cliente.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.cliente.delete({ where: { id } });
  }
}
