import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AgendamentoRepository } from './agendamento.repository';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { ReagendarAgendamentoDto } from './dto/reagendar-agendamento.dto';
import { ConcluirAgendamentoDto } from './dto/concluir-agendamento.dto';
import { PrismaService } from '../../database/prisma.service';
import { MessagingService } from '../../common/messaging/messaging.service';
import {
  ERP_ROUTING_KEY,
  AgendamentoCriadoEvent,
  AgendamentoCanceladoEvent,
  AgendamentoConcluidoEvent,
} from '../../common/messaging/erp-events';

@Injectable()
export class AgendamentoService {
  private readonly logger = new Logger(AgendamentoService.name);

  constructor(
    @Inject(AgendamentoRepository) private repository: AgendamentoRepository,
    @Inject(MessagingService) private messaging: MessagingService,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {}

  async list(empresaId: string, page: number, limit: number, data?: string) {
    const skip = (page - 1) * limit;
    const date = data ? new Date(`${data}T12:00:00.000Z`) : undefined;
    const { data: result, total } = await this.repository.findAll(empresaId, skip, limit, date);
    return { data: result.map((ag) => this.formatAgendamento(ag)), total, page, limit };
  }

  async get(id: string, empresaId: string) {
    const ag = await this.repository.findById(id, empresaId);
    if (!ag) throw new NotFoundException('Agendamento não encontrado');
    return this.formatAgendamento(ag);
  }

  async create(dto: CreateAgendamentoDto, empresaId: string) {
    const pedido = await this.repository.findPedidoWithServicosAndAgendamento(dto.pedidoId, empresaId);
    if (!pedido) throw new NotFoundException('Pedido não encontrado');
    if (pedido.agendamento) throw new ConflictException('Pedido já possui agendamento');
    if (pedido.servicos.length === 0) throw new BadRequestException('Pedido não possui serviços');
    if (pedido.status === 'CANCELADO') throw new ConflictException('Pedido está cancelado');

    const vinculo = await this.repository.findFuncionarioWithServicos(dto.funcionarioId, empresaId);
    if (!vinculo) throw new NotFoundException('Funcionário não encontrado nesta empresa');

    const sala = await this.repository.findSalaById(dto.salaId, empresaId);
    if (!sala) throw new NotFoundException('Sala não encontrada');

    const servicosDoFuncionario = new Set(vinculo.funcionario.servicos.map((fs) => fs.servicoId));
    const semEspecialidade = pedido.servicos.filter((ps) => !servicosDoFuncionario.has(ps.servicoId));
    if (semEspecialidade.length > 0) {
      const nomes = semEspecialidade.map((ps) => ps.servico.nome).join(', ');
      throw new ConflictException(`Funcionário não tem especialidade em: ${nomes}`);
    }

    const duracaoTotal = pedido.servicos.reduce((acc, ps) => acc + ps.servico.duracao, 0);
    // Todos os timestamps são armazenados em UTC (TIMESTAMPTZ).
    // A API recebe horaInicio como "HH:mm" e data como "YYYY-MM-DD" — ambas tratadas como UTC.
    const start = new Date(`${dto.data}T${dto.horaInicio}:00.000-03:00`);
    const end = new Date(start.getTime() + duracaoTotal * 60_000);

    const result = await this.repository.$transaction(async (tx) => {
      const conflitos = await this.repository.findConflitos(tx, {
        salaId: dto.salaId,
        funcionarioId: dto.funcionarioId,
        empresaId,
        start,
        end,
      });

      if (conflitos.length > 0) {
        const conflito = conflitos[0];
        const toSP = (d: Date) => new Date(d.getTime() - 3 * 3600_000).toISOString().substring(11, 16);
        const horaInicioStr = toSP(conflito.horaInicio);
        const horaFimStr = toSP(conflito.horaFim);
        throw new ConflictException(
          `Conflito de horário: ${
            conflito.salaId === dto.salaId ? 'sala' : 'funcionário'
          } já ocupado(a) das ${horaInicioStr} às ${horaFimStr}`,
        );
      }

      const ag = await this.repository.createAgendamento(tx, {
        pedidoId: dto.pedidoId,
        funcionarioId: dto.funcionarioId,
        salaId: dto.salaId,
        empresaId,
        data: new Date(`${dto.data}T12:00:00.000-03:00`),
        horaInicio: start,
        horaFim: end,
      });

      await this.repository.updatePedidoStatus(tx, dto.pedidoId, 'AGENDADO');
      return ag;
    });

    const agComRelacoes = await this.repository.findById(result.id, empresaId);
    if (agComRelacoes) {
      const servicoNome = agComRelacoes.pedido.servicos.map((ps) => ps.servico.nome).join(', ');
      const event: AgendamentoCriadoEvent = {
        agendamentoId: agComRelacoes.id,
        empresaId: agComRelacoes.empresaId,
        clienteId: agComRelacoes.pedido.cliente.id,
        clienteNome: agComRelacoes.pedido.cliente.nome,
        clienteTelefone: agComRelacoes.pedido.cliente.telefone,
        funcionarioNome: agComRelacoes.funcionario.nome,
        servicoNome,
        horaInicio: agComRelacoes.horaInicio.toISOString(),
        horaFim: agComRelacoes.horaFim.toISOString(),
      };
      this.messaging.publish(ERP_ROUTING_KEY.AGENDAMENTO_CRIADO, event).catch((err) =>
        this.logger.error('Erro ao publicar agendamento.criado', err),
      );
    }

    return this.formatAgendamento(result);
  }

  async cancel(id: string, empresaId: string) {
    const ag = await this.repository.findAgendamentoRaw(id, empresaId);
    if (!ag) throw new NotFoundException('Agendamento não encontrado');
    if (ag.status !== 'AGENDADO') {
      throw new ConflictException(`Agendamento com status ${ag.status} não pode ser cancelado`);
    }

    const cancelled = await this.repository.$transaction(async (tx) => {
      const updated = await this.repository.updateAgendamentoStatus(tx, id, 'CANCELADO');
      await this.repository.updatePedidoStatus(tx, ag.pedidoId, 'CANCELADO');
      return updated;
    });

    const agComRelacoes = await this.repository.findById(id, empresaId);
    if (agComRelacoes) {
      const event: AgendamentoCanceladoEvent = {
        agendamentoId: agComRelacoes.id,
        empresaId: agComRelacoes.empresaId,
        clienteId: agComRelacoes.pedido.cliente.id,
        clienteNome: agComRelacoes.pedido.cliente.nome,
        clienteTelefone: agComRelacoes.pedido.cliente.telefone,
      };
      this.messaging.publish(ERP_ROUTING_KEY.AGENDAMENTO_CANCELADO, event).catch((err) =>
        this.logger.error('Erro ao publicar agendamento.cancelado', err),
      );
    }

    return this.formatAgendamento(cancelled);
  }

  async conclude(id: string, empresaId: string, dto?: ConcluirAgendamentoDto) {
    const ag = await this.repository.findAgendamentoRaw(id, empresaId);
    if (!ag) throw new NotFoundException('Agendamento não encontrado');
    if (ag.status !== 'AGENDADO') {
      throw new ConflictException(`Agendamento com status ${ag.status} não pode ser concluído`);
    }

    const concluded = await this.repository.$transaction(async (tx) => {
      const updated = await this.repository.updateAgendamentoStatus(tx, id, 'CONCLUIDO');
      await this.repository.updatePedidoStatus(tx, ag.pedidoId, 'CONCLUIDO');
      return updated;
    });

    const agComRelacoes = await this.repository.findById(id, empresaId);
    if (agComRelacoes) {
      const valorTotal = agComRelacoes.pedido.servicos.reduce(
        (sum, ps) => sum + Number(ps.servico.preco),
        0,
      );
      const servicoNome = agComRelacoes.pedido.servicos.map((ps) => ps.servico.nome).join(', ');

      if (dto?.formaPagamento) {
        await this.prisma.pagamento.create({
          data: {
            empresaId,
            agendamentoId: id,
            clienteId: agComRelacoes.pedido.cliente.id,
            valor: valorTotal,
            desconto: dto.desconto,
            formaPagamento: dto.formaPagamento as any,
            status: 'CONFIRMADO',
            pagoEm: new Date(),
            observacoes: dto.observacoes,
          },
        });
      }

      const event: AgendamentoConcluidoEvent = {
        agendamentoId: agComRelacoes.id,
        empresaId: agComRelacoes.empresaId,
        clienteId: agComRelacoes.pedido.cliente.id,
        clienteNome: agComRelacoes.pedido.cliente.nome,
        clienteTelefone: agComRelacoes.pedido.cliente.telefone,
        valorTotal,
        servicoNome,
      };
      this.messaging.publish(ERP_ROUTING_KEY.AGENDAMENTO_CONCLUIDO, event).catch((err) =>
        this.logger.error('Erro ao publicar agendamento.concluido', err),
      );

      this.baixarEstoque(id, empresaId, agComRelacoes).catch((err) =>
        this.logger.error('Erro ao baixar estoque pós-conclusão', err),
      );
    }

    return this.formatAgendamento(concluded);
  }

  private async baixarEstoque(agendamentoId: string, empresaId: string, ag: any) {
    const servicoIds = ag.pedido.servicos.map((ps: any) => ps.servico.id);
    const insumos = await this.prisma.servicoProduto.findMany({
      where: { servicoId: { in: servicoIds } },
    });
    if (!insumos.length) return;

    for (const insumo of insumos) {
      await this.prisma.$transaction([
        this.prisma.produto.update({
          where: { id: insumo.produtoId },
          data: { estoqueAtual: { decrement: Number(insumo.quantidade) } },
        }),
        this.prisma.movimentoEstoque.create({
          data: {
            produtoId: insumo.produtoId,
            empresaId,
            funcionarioId: ag.funcionario.id,
            tipo: 'SAIDA',
            quantidade: Number(insumo.quantidade),
            referencia: `Agendamento ${agendamentoId}`,
            agendamentoId,
          },
        }),
      ]);
    }
  }

  async reagendar(id: string, empresaId: string, dto: ReagendarAgendamentoDto, userId: string) {
    const ag = await this.repository.findAgendamentoRaw(id, empresaId);
    if (!ag) throw new NotFoundException('Agendamento não encontrado');
    if (ag.status !== 'AGENDADO') {
      throw new ConflictException(`Agendamento com status ${ag.status} não pode ser reagendado`);
    }

    const pedido = await this.repository.findPedidoDuracaoTotal(ag.pedidoId);
    if (!pedido) throw new NotFoundException('Pedido não encontrado');

    const duracaoTotal = pedido.servicos.reduce((acc, ps) => acc + ps.servico.duracao, 0);
    const newStart = new Date(`${dto.data}T${dto.horaInicio}:00.000-03:00`);
    const newEnd = new Date(newStart.getTime() + duracaoTotal * 60_000);
    const newSalaId = dto.salaId ?? ag.salaId;

    const result = await this.repository.$transaction(async (tx) => {
      const conflitos = await this.repository.findConflitosExcluindo(tx, {
        salaId: newSalaId,
        funcionarioId: ag.funcionarioId,
        empresaId,
        start: newStart,
        end: newEnd,
        excludeAgendamentoId: id,
      });

      if (conflitos.length > 0) {
        const conflito = conflitos[0];
        const toSP = (d: Date) => new Date(d.getTime() - 3 * 3600_000).toISOString().substring(11, 16);
        const hi = toSP(conflito.horaInicio);
        const hf = toSP(conflito.horaFim);
        throw new ConflictException(
          `Conflito de horário: ${conflito.salaId === newSalaId ? 'sala' : 'funcionário'} já ocupado(a) das ${hi} às ${hf}`,
        );
      }

      await this.repository.createHistorico(tx, {
        agendamentoId: id,
        funcionarioId: ag.funcionarioId,
        salaId: ag.salaId,
        data: ag.data,
        horaInicio: ag.horaInicio,
        horaFim: ag.horaFim,
        motivoReagendamento: dto.motivoReagendamento,
        reagendadoPorId: userId,
      });

      return this.repository.updateAgendamento(tx, id, {
        data: new Date(`${dto.data}T12:00:00.000-03:00`),
        horaInicio: newStart,
        horaFim: newEnd,
        salaId: newSalaId,
      });
    });
    return this.formatAgendamento(result);
  }

  private formatAgendamento(ag: any) {
    if (!ag) return ag;
    const toSP = (d: Date) => new Date(d.getTime() - 3 * 3600_000).toISOString().substring(11, 16);
    return {
      ...ag,
      data: (ag.data as Date).toISOString().substring(0, 10),
      horaInicio: toSP(ag.horaInicio as Date),
      horaFim: toSP(ag.horaFim as Date),
    };
  }
}
