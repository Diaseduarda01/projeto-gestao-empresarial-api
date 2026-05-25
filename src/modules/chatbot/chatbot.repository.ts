import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ChatbotRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findServico(servicoId: string, empresaId: string) {
    return this.prisma.servico.findFirst({
      where: { id: servicoId, empresaId, deletedAt: null },
      select: { id: true, nome: true, duracao: true, preco: true },
    });
  }

  findServicos(empresaId: string) {
    return this.prisma.servico.findMany({
      where: { empresaId, deletedAt: null },
      select: { id: true, nome: true, duracao: true, preco: true },
      orderBy: { nome: 'asc' },
    });
  }

  findClienteByTelefone(telefone: string, empresaId: string) {
    return this.prisma.cliente.findFirst({
      where: { telefone, empresaId, deletedAt: null },
      select: { id: true, nome: true },
    });
  }

  findClienteByEmail(email: string, empresaId: string) {
    return this.prisma.cliente.findFirst({
      where: { email, empresaId, deletedAt: null },
      select: { id: true, nome: true },
    });
  }

  async upsertCliente(params: {
    empresaId: string;
    nome: string;
    telefone?: string;
    email?: string;
  }): Promise<{ id: string; nome: string; novo: boolean }> {
    const telefone = params.telefone || 'sem-telefone';
    const email = params.email ?? `web_${telefone.replace(/\D/g, '')}@booking.local`;

    const existente = await this.prisma.cliente.findFirst({
      where: { email, empresaId: params.empresaId },
      select: { id: true, nome: true, deletedAt: true },
    });

    if (existente) {
      if (existente.deletedAt) {
        await this.prisma.cliente.update({
          where: { id: existente.id },
          data: { deletedAt: null, nome: params.nome, telefone },
        });
      }
      return { id: existente.id, nome: existente.nome, novo: false };
    }

    const criado = await this.prisma.cliente.create({
      data: {
        nome: params.nome,
        telefone,
        email,
        empresaId: params.empresaId,
      },
      select: { id: true, nome: true },
    });
    return { ...criado, novo: true };
  }

  async findFuncionariosComEspecialidade(servicoId: string, empresaId: string): Promise<string[]> {
    const vinculos = await this.prisma.funcionarioEmpresa.findMany({
      where: {
        empresaId,
        funcionario: { servicos: { some: { servicoId } } },
      },
      select: { funcionarioId: true },
    });
    return vinculos.map((v) => v.funcionarioId);
  }

  async findSalasAtivas(empresaId: string): Promise<{ id: string }[]> {
    return this.prisma.sala.findMany({
      where: { empresaId, deletedAt: null },
      select: { id: true },
    });
  }

  findAgendamentosNoDia(
    empresaId: string,
    funcIds: string[],
    salaIds: string[],
    dataStart: Date,
    dataEnd: Date,
  ) {
    return this.prisma.agendamento.findMany({
      where: {
        empresaId,
        status: 'AGENDADO',
        horaInicio: { gte: dataStart, lte: dataEnd },
        OR: [{ funcionarioId: { in: funcIds } }, { salaId: { in: salaIds } }],
      },
      select: { funcionarioId: true, salaId: true, horaInicio: true, horaFim: true },
    });
  }

  findAgendamentosDoCliente(empresaId: string, clienteId: string) {
    return this.prisma.agendamento.findMany({
      where: {
        empresaId,
        pedido: { clienteId },
        status: { not: 'CANCELADO' },
      },
      select: {
        id: true,
        data: true,
        horaInicio: true,
        status: true,
        pedido: { select: { servicos: { select: { servico: { select: { nome: true } } } } } },
      },
      orderBy: { horaInicio: 'asc' },
    });
  }

  findHorarioFuncionamento(empresaId: string, diaSemana: number) {
    return this.prisma.horarioFuncionamento.findUnique({
      where: { empresaId_diaSemana: { empresaId, diaSemana } },
      select: { horaAbertura: true, horaFechamento: true, ativo: true },
    });
  }

  async cancelarAgendamento(agendamentoId: string, empresaId: string) {
    const agendamento = await this.prisma.agendamento.findFirst({
      where: { id: agendamentoId, empresaId },
    });
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado');
    if (agendamento.status !== 'AGENDADO') throw new BadRequestException('Agendamento não pode ser cancelado');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.agendamento.update({
        where: { id: agendamentoId },
        data: { status: 'CANCELADO' },
        select: { id: true, status: true },
      });
      await tx.pedido.update({
        where: { id: agendamento.pedidoId },
        data: { status: 'CANCELADO' },
      });
      return updated;
    }) as Promise<{ id: string; status: string }>;
  }

  async criarPedidoEAgendamento(params: {
    clienteId: string;
    servicoId: string;
    funcionarioId: string;
    salaId: string;
    empresaId: string;
    data: Date;
    horaInicio: Date;
    horaFim: Date;
    nomeServico: string;
  }): Promise<{ agendamentoId: string; confirmacao: string; cancelToken: string }> {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.create({
        data: {
          clienteId: params.clienteId,
          empresaId: params.empresaId,
          servicos: { create: { servicoId: params.servicoId } },
        },
      });

      const { randomUUID } = await import('crypto');
      const agendamento = await tx.agendamento.create({
        data: {
          pedidoId: pedido.id,
          funcionarioId: params.funcionarioId,
          salaId: params.salaId,
          empresaId: params.empresaId,
          data: params.data,
          horaInicio: params.horaInicio,
          horaFim: params.horaFim,
          cancelToken: randomUUID(),
        },
      });

      await tx.pedido.update({ where: { id: pedido.id }, data: { status: 'AGENDADO' } });

      const dataFmt = params.data.toISOString().substring(0, 10).split('-').reverse().join('/');
      const horaFmt = params.horaInicio.toISOString().substring(11, 16);
      const confirmacao = `Agendamento confirmado para ${dataFmt} às ${horaFmt} — ${params.nomeServico}. Código: ${agendamento.id.substring(0, 8).toUpperCase()}`;

      return { agendamentoId: agendamento.id, confirmacao, cancelToken: agendamento.cancelToken! };
    }) as Promise<{ agendamentoId: string; confirmacao: string; cancelToken: string }>;
  }
}
