import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const PUBLIC_FIELDS = { id: true, nome: true, email: true, createdAt: true } as const;

@Injectable()
export class FuncionarioRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findAll() {
    return this.prisma.funcionario.findMany({
      select: PUBLIC_FIELDS,
      orderBy: { nome: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.funcionario.findUnique({ where: { id }, select: PUBLIC_FIELDS });
  }

  create(data: { nome: string; email: string; senha: string }) {
    return this.prisma.funcionario.create({
      data,
      select: PUBLIC_FIELDS,
    });
  }

  update(id: string, data: Partial<{ nome: string; email: string; senha: string }>) {
    return this.prisma.funcionario.update({
      where: { id },
      data,
      select: PUBLIC_FIELDS,
    });
  }

  delete(id: string) {
    return this.prisma.funcionario.delete({ where: { id } });
  }

  findAgendamentoFuturo(funcionarioId: string) {
    return this.prisma.agendamento.findFirst({
      where: {
        funcionarioId,
        status: 'AGENDADO',
        horaInicio: { gte: new Date() },
      },
    });
  }

  findServicos(funcionarioId: string) {
    return this.prisma.funcionarioServico.findMany({
      where: { funcionarioId },
      include: { servico: true },
    });
  }

  findServicosByIds(servicoIds: string[]) {
    return this.prisma.servico.findMany({ where: { id: { in: servicoIds } } });
  }

  addServicos(funcionarioId: string, servicoIds: string[]) {
    return this.prisma.funcionarioServico.createMany({
      data: servicoIds.map((servicoId) => ({ funcionarioId, servicoId })),
      skipDuplicates: true,
    });
  }

  removeServico(funcionarioId: string, servicoId: string) {
    return this.prisma.funcionarioServico.delete({
      where: { funcionarioId_servicoId: { funcionarioId, servicoId } },
    });
  }
}
