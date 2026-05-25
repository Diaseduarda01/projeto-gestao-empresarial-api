import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ListaEsperaRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  create(data: {
    clienteId: string;
    empresaId: string;
    servicoId: string;
    funcionarioId?: string;
    dataDesejada: Date;
  }) {
    return this.prisma.listaEspera.create({
      data,
      include: {
        cliente: { select: { id: true, nome: true, telefone: true } },
        servico: { select: { id: true, nome: true } },
        funcionario: { select: { id: true, nome: true } },
      },
    });
  }

  async findAll(empresaId: string, skip: number, take: number, atendida?: boolean) {
    const where = { empresaId, ...(atendida !== undefined ? { atendida } : {}) };
    const [data, total] = await Promise.all([
      this.prisma.listaEspera.findMany({
        where,
        include: {
          cliente: { select: { id: true, nome: true, telefone: true } },
          servico: { select: { id: true, nome: true } },
          funcionario: { select: { id: true, nome: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take,
      }),
      this.prisma.listaEspera.count({ where }),
    ]);
    return { data, total };
  }

  findById(id: string, empresaId: string) {
    return this.prisma.listaEspera.findFirst({
      where: { id, empresaId },
      include: {
        cliente: { select: { id: true, nome: true, telefone: true } },
        servico: { select: { id: true, nome: true } },
        funcionario: { select: { id: true, nome: true } },
      },
    });
  }

  marcarAtendida(id: string) {
    return this.prisma.listaEspera.update({ where: { id }, data: { atendida: true } });
  }

  remove(id: string) {
    return this.prisma.listaEspera.delete({ where: { id } });
  }
}
