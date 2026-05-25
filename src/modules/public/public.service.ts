import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ChatbotService } from '../chatbot/chatbot.service';

@Injectable()
export class PublicService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ChatbotService) private readonly chatbotService: ChatbotService,
  ) {}

  private async findEmpresaBySlug(slug: string) {
    const empresa = await this.prisma.empresa.findUnique({ where: { slug } });
    if (!empresa) throw new NotFoundException('Empresa não encontrada');
    return empresa;
  }

  async getEmpresa(empresaSlug: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { slug: empresaSlug },
      include: {
        horarioFuncionamento: {
          orderBy: { diaSemana: 'asc' },
        },
      },
    });

    if (!empresa) throw new NotFoundException('Empresa não encontrada');

    const horarioFormatado = empresa.horarioFuncionamento
      .map((h) => {
        const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return `${dias[h.diaSemana]}: ${h.horaAbertura} - ${h.horaFechamento}`;
      })
      .join('\n');

    return {
      id: empresa.id,
      nome: empresa.nome,
      slug: empresa.slug,
      logoUrl: null,
      endereco: null,
      telefone: null,
      horarioFuncionamento: horarioFormatado || null,
    };
  }

  async listarServicos(empresaSlug: string) {
    const empresa = await this.findEmpresaBySlug(empresaSlug);
    const servicos = await this.prisma.servico.findMany({
      where: { empresaId: empresa.id },
      select: { id: true, nome: true, descricao: true, duracao: true, preco: true },
      orderBy: { nome: 'asc' },
    });
    return servicos.map((s) => ({
      id: s.id,
      nome: s.nome,
      descricao: s.descricao,
      duracaoMinutos: s.duracao,
      preco: s.preco.toString(),
    }));
  }

  async listarProfissionais(empresaSlug: string, servicoId?: string) {
    const empresa = await this.findEmpresaBySlug(empresaSlug);

    if (servicoId) {
      const vinculos = await this.prisma.funcionarioEmpresa.findMany({
        where: {
          empresaId: empresa.id,
          funcionario: { servicos: { some: { servicoId } } },
        },
        include: { funcionario: { select: { id: true, nome: true } } },
      });
      return vinculos.map((v) => v.funcionario);
    }

    const vinculos = await this.prisma.funcionarioEmpresa.findMany({
      where: { empresaId: empresa.id },
      include: { funcionario: { select: { id: true, nome: true } } },
    });
    return vinculos.map((v) => v.funcionario);
  }

  async disponibilidade(
    empresaSlug: string,
    servicoId: string,
    data: string,
    funcionarioId?: string,
  ) {
    const empresa = await this.findEmpresaBySlug(empresaSlug);
    const slots = await this.chatbotService.disponibilidade(empresa.id, servicoId, data);

    const profissionais = await this.listarProfissionais(empresaSlug, servicoId);
    const primeiroProf = profissionais[0];

    const horarios = slots.map((slot) => ({
      inicio: slot,
      fim: slot,
      funcionarioId: funcionarioId || primeiroProf?.id || null,
      funcionarioNome: funcionarioId
        ? profissionais.find((p) => p.id === funcionarioId)?.nome || 'Profissional'
        : primeiroProf?.nome || 'Qualquer disponível',
    }));

    return { data, horarios };
  }

  async cancelarPorToken(cancelToken: string) {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { cancelToken },
    });

    if (!agendamento || agendamento.status !== 'AGENDADO') return null;

    await this.prisma.$transaction([
      this.prisma.agendamento.update({
        where: { id: agendamento.id },
        data: { status: 'CANCELADO' },
      }),
      this.prisma.pedido.update({
        where: { id: agendamento.pedidoId },
        data: { status: 'CANCELADO' },
      }),
    ]);

    return true;
  }
}
