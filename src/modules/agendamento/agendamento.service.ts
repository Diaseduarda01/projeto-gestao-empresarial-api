import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgendamentoRepository } from './agendamento.repository';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';

@Injectable()
export class AgendamentoService {
  constructor(
    @Inject(AgendamentoRepository) private repository: AgendamentoRepository,
  ) {}

  list(data?: string) {
    const date = data ? new Date(`${data}T00:00:00.000Z`) : undefined;
    return this.repository.findAll(date);
  }

  async get(id: string) {
    const ag = await this.repository.findById(id);
    if (!ag) throw new NotFoundException('Agendamento não encontrado');
    return ag;
  }

  async create(dto: CreateAgendamentoDto) {
    // 1. Buscar pedido com serviços e agendamento
    const pedido = await this.repository.findPedidoWithServicosAndAgendamento(dto.pedidoId);

    // 2. Verificações do pedido
    if (!pedido) throw new NotFoundException('Pedido não encontrado');
    if (pedido.agendamento) throw new ConflictException('Pedido já possui agendamento');
    if (pedido.servicos.length === 0) throw new BadRequestException('Pedido não possui serviços');
    if (pedido.status === 'CANCELADO') throw new ConflictException('Pedido está cancelado');

    // 3. Verificar funcionário e especialidades
    const funcionario = await this.repository.findFuncionarioWithServicos(dto.funcionarioId);
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');

    // 4. Verificar sala
    const sala = await this.repository.findSalaById(dto.salaId);
    if (!sala) throw new NotFoundException('Sala não encontrada');

    // 5. Verificar que o funcionário tem especialidade em todos os serviços do pedido
    const servicosDoFuncionario = new Set(funcionario.servicos.map((fs) => fs.servicoId));
    const semEspecialidade = pedido.servicos.filter((ps) => !servicosDoFuncionario.has(ps.servicoId));
    if (semEspecialidade.length > 0) {
      const nomes = semEspecialidade.map((ps) => ps.servico.nome).join(', ');
      throw new ConflictException(`Funcionário não tem especialidade em: ${nomes}`);
    }

    // 6. Calcular duração total e janela de tempo
    const duracaoTotal = pedido.servicos.reduce((acc, ps) => acc + ps.servico.duracao, 0);
    const start = new Date(`${dto.data}T${dto.horaInicio}:00.000Z`);
    const end = new Date(start.getTime() + duracaoTotal * 60_000);

    // 7. Verificação de conflito e criação dentro da mesma transaction (evita race condition)
    return this.repository.$transaction(async (tx) => {
      const conflitos = await this.repository.findConflitos(tx, {
        salaId: dto.salaId,
        funcionarioId: dto.funcionarioId,
        start,
        end,
      });

      if (conflitos.length > 0) {
        throw new ConflictException(
          'Conflito de horário: sala ou funcionário já ocupados neste período',
        );
      }

      const ag = await this.repository.createAgendamento(tx, {
        pedidoId: dto.pedidoId,
        funcionarioId: dto.funcionarioId,
        salaId: dto.salaId,
        data: new Date(`${dto.data}T00:00:00.000Z`),
        horaInicio: start,
        horaFim: end,
      });

      await this.repository.updatePedidoStatus(tx, dto.pedidoId, 'AGENDADO');

      return ag;
    });
  }

  async cancel(id: string) {
    const ag = await this.repository.findAgendamentoRaw(id);
    if (!ag) throw new NotFoundException('Agendamento não encontrado');
    if (ag.status !== 'AGENDADO') {
      throw new ConflictException(
        `Agendamento com status ${ag.status} não pode ser cancelado`,
      );
    }

    return this.repository.$transaction(async (tx) => {
      const updated = await this.repository.updateAgendamentoStatus(tx, id, 'CANCELADO');
      await this.repository.updatePedidoStatus(tx, ag.pedidoId, 'CANCELADO');
      return updated;
    });
  }

  async conclude(id: string) {
    const ag = await this.repository.findAgendamentoRaw(id);
    if (!ag) throw new NotFoundException('Agendamento não encontrado');
    if (ag.status !== 'AGENDADO') {
      throw new ConflictException(
        `Agendamento com status ${ag.status} não pode ser concluído`,
      );
    }

    return this.repository.$transaction(async (tx) => {
      const updated = await this.repository.updateAgendamentoStatus(tx, id, 'CONCLUIDO');
      await this.repository.updatePedidoStatus(tx, ag.pedidoId, 'CONCLUIDO');
      return updated;
    });
  }
}
