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

  findAll() {
    return this.prisma.empresa.findMany({ orderBy: { createdAt: 'desc' } });
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

  updateAtivo(id: string, ativo: boolean) {
    return this.prisma.empresa.update({ where: { id }, data: { ativo } });
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

  createFuncionario(data: { nome: string; email: string; senha: string; emailVerificado?: boolean }) {
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

  createConviteToken(data: { token: string; email: string; nome?: string; empresaId: string; papel: Role; expiresAt: Date }) {
    return this.prisma.conviteToken.create({ data });
  }

  findConviteToken(token: string) {
    return this.prisma.conviteToken.findUnique({ where: { token }, include: { empresa: { select: { nome: true } } } });
  }

  useConviteToken(id: string) {
    return this.prisma.conviteToken.update({ where: { id }, data: { usedAt: new Date() } });
  }

  createEmailVerificationToken(data: { token: string; funcionarioId: string; expiresAt: Date }) {
    return this.prisma.emailVerificationToken.create({ data });
  }

  findEmailVerificationToken(token: string) {
    return this.prisma.emailVerificationToken.findUnique({ where: { token } });
  }

  markEmailVerificado(funcionarioId: string) {
    return this.prisma.funcionario.update({ where: { id: funcionarioId }, data: { emailVerificado: true } });
  }

  useEmailVerificationToken(id: string) {
    return this.prisma.emailVerificationToken.update({ where: { id }, data: { usedAt: new Date() } });
  }

  async registrar(data: {
    nome: string;
    slug: string;
    adminNome: string;
    adminEmail: string;
    adminSenha: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const empresa = await tx.empresa.create({ data: { nome: data.nome, slug: data.slug } });
      const admin = await tx.funcionario.create({
        data: { nome: data.adminNome, email: data.adminEmail, senha: data.adminSenha, emailVerificado: false },
      });
      await tx.funcionarioEmpresa.create({ data: { funcionarioId: admin.id, empresaId: empresa.id, papel: Role.ADMIN } });
      return { empresa, admin };
    });
  }
}
