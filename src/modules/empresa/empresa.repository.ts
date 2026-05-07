import { Injectable, Inject } from '@nestjs/common';
import { Plano, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EmpresaRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.empresa.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.prisma.empresa.findUnique({ where: { slug } });
  }

  findByFuncionario(funcionarioId: string) {
    return this.prisma.funcionarioEmpresa.findMany({
      where: { funcionarioId },
      include: { empresa: true },
    });
  }

  create(data: { nome: string; slug: string; plano?: Plano }) {
    return this.prisma.empresa.create({ data });
  }

  vincularFuncionario(funcionarioId: string, empresaId: string, papel: Role) {
    return this.prisma.funcionarioEmpresa.upsert({
      where: { funcionarioId_empresaId: { funcionarioId, empresaId } },
      update: { papel },
      create: { funcionarioId, empresaId, papel },
    });
  }

  findVinculo(funcionarioId: string, empresaId: string) {
    return this.prisma.funcionarioEmpresa.findUnique({
      where: { funcionarioId_empresaId: { funcionarioId, empresaId } },
    });
  }

  findFuncionarioByEmail(email: string) {
    return this.prisma.funcionario.findUnique({ where: { email } });
  }

  createFuncionario(data: { nome: string; email: string; senha: string }) {
    return this.prisma.funcionario.create({ data });
  }

  listFuncionarios(empresaId: string) {
    return this.prisma.funcionarioEmpresa.findMany({
      where: { empresaId },
      include: {
        funcionario: { select: { id: true, nome: true, email: true, createdAt: true } },
      },
      orderBy: { funcionario: { nome: 'asc' } },
    });
  }
}
