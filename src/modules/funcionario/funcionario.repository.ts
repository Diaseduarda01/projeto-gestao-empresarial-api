import { Injectable, Inject } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const PUBLIC_FIELDS = { id: true, nome: true, email: true, createdAt: true } as const;

@Injectable()
export class FuncionarioRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async findAll(empresaId: string, skip: number, take: number) {
    const [data, total] = await Promise.all([
      this.prisma.funcionarioEmpresa.findMany({
        where: { empresaId },
        include: { funcionario: { select: PUBLIC_FIELDS } },
        orderBy: { funcionario: { nome: 'asc' } },
        skip,
        take,
      }),
      this.prisma.funcionarioEmpresa.count({ where: { empresaId } }),
    ]);
    return { data, total };
  }

  findById(id: string, empresaId: string) {
    return this.prisma.funcionarioEmpresa.findUnique({
      where: { funcionarioId_empresaId: { funcionarioId: id, empresaId } },
      include: { funcionario: { select: PUBLIC_FIELDS } },
    });
  }

  async create(data: { nome: string; email: string; senha: string }, empresaId: string, papel: Role) {
    const funcionario = await this.prisma.funcionario.create({ data, select: PUBLIC_FIELDS });
    await this.prisma.funcionarioEmpresa.create({
      data: { funcionarioId: funcionario.id, empresaId, papel },
    });
    return funcionario;
  }

  update(id: string, data: Partial<{ nome: string; email: string; senha: string }>) {
    return this.prisma.funcionario.update({ where: { id }, data, select: PUBLIC_FIELDS });
  }

  removeFromEmpresa(funcionarioId: string, empresaId: string) {
    return this.prisma.funcionarioEmpresa.delete({
      where: { funcionarioId_empresaId: { funcionarioId, empresaId } },
    });
  }

  findAgendamentoFuturo(funcionarioId: string, empresaId: string) {
    return this.prisma.agendamento.findFirst({
      where: { funcionarioId, empresaId, status: 'AGENDADO', horaInicio: { gte: new Date() } },
    });
  }

  findServicos(funcionarioId: string) {
    return this.prisma.funcionarioServico.findMany({
      where: { funcionarioId },
      include: { servico: true },
    });
  }

  findServicosByIds(servicoIds: string[], empresaId: string) {
    return this.prisma.servico.findMany({ where: { id: { in: servicoIds }, empresaId } });
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

  // HorarioTrabalho

  listHorariosTrabalho(funcionarioId: string, empresaId: string) {
    return this.prisma.horarioTrabalho.findMany({
      where: { funcionarioId, empresaId },
      orderBy: { diaSemana: 'asc' },
    });
  }

  upsertHorarioTrabalho(
    funcionarioId: string,
    empresaId: string,
    diaSemana: number,
    data: { horaInicio: string; horaFim: string },
  ) {
    return this.prisma.horarioTrabalho.upsert({
      where: { funcionarioId_empresaId_diaSemana: { funcionarioId, empresaId, diaSemana } },
      update: data,
      create: { funcionarioId, empresaId, diaSemana, ...data },
    });
  }

  removeHorarioTrabalho(funcionarioId: string, empresaId: string, diaSemana: number) {
    return this.prisma.horarioTrabalho.deleteMany({
      where: { funcionarioId, empresaId, diaSemana },
    });
  }

  // BloqueioAgenda

  listBloqueios(funcionarioId: string, empresaId: string) {
    return this.prisma.bloqueioAgenda.findMany({
      where: { funcionarioId, empresaId },
      orderBy: { data: 'asc' },
    });
  }

  createBloqueio(data: {
    funcionarioId: string;
    empresaId: string;
    data: Date;
    horaInicio?: string;
    horaFim?: string;
    motivo?: string;
  }) {
    return this.prisma.bloqueioAgenda.create({ data });
  }

  removeBloqueio(id: string, empresaId: string) {
    return this.prisma.bloqueioAgenda.deleteMany({ where: { id, empresaId } });
  }

  // Disponibilidade

  async findDisponibilidade(funcionarioId: string, empresaId: string, data: string) {
    const date = new Date(`${data}T00:00:00.000Z`);
    const dayOfWeek = date.getUTCDay();

    const [horarioTrabalho, agendamentos, bloqueios] = await Promise.all([
      this.prisma.horarioTrabalho.findUnique({
        where: { funcionarioId_empresaId_diaSemana: { funcionarioId, empresaId, diaSemana: dayOfWeek } },
      }),
      this.prisma.agendamento.findMany({
        where: { funcionarioId, empresaId, data: date, status: 'AGENDADO' },
        select: { horaInicio: true, horaFim: true },
      }),
      this.prisma.bloqueioAgenda.findMany({
        where: { funcionarioId, empresaId, data: date },
      }),
    ]);

    return { horarioTrabalho, agendamentos, bloqueios, dayOfWeek };
  }
}
