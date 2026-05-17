import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PlatformAdminRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findAllEmpresas() {
    return this.prisma.empresa.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { funcionarios: true, clientes: true, agendamentos: true } },
      },
    });
  }

  findEmpresaById(id: string) {
    return this.prisma.empresa.findUnique({ where: { id } });
  }

  updateAtivo(id: string, ativo: boolean) {
    return this.prisma.empresa.update({ where: { id }, data: { ativo } });
  }
}
