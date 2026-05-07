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
  constructor(@Inject(AgendamentoRepository) private repository: AgendamentoRepository) {}

  async list(empresaId: string, page: number, limit: number, data?: string) {
    const skip = (page - 1) * limit;
    const date = data ? new Date(`${data}T00:00:00.000Z`) : undefined;
    const { data: result, total } = await this.repository.findAll(empresaId, skip, limit, date);
    return { data: result, total, page, limit };
  }

  async get(id: string, empresaId: string) {
    const ag = await this.repository.findById(id, empresaId);
    if (!ag) throw new NotFoundException('Agendamento não encontrado');
    return ag;
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
    const start = new Date(`${dto.data}T${dto.horaInicio}:00.000Z`);
    const end = new Date(start.getTime() + duracaoTotal * 60_000);

    return this.repository.$transaction(async (tx) => {
      const conflitos = await this.repository.findConflitos(tx, {
        salaId: dto.salaId,
        funcionarioId: dto.funcionarioId,
        empresaId,
        start,
        end,
      });

      if (conflitos.length > 0) {
        throw new ConflictException('Conflito de horário: sala ou funcionário já ocupados neste período');
      }

      const ag = await this.repository.createAgendamento(tx, {
        pedidoId: dto.pedidoId,
        funcionarioId: dto.funcionarioId,
        salaId: dto.salaId,
        empresaId,
        data: new Date(`${dto.data}T00:00:00.000Z`),
        horaInicio: start,
        horaFim: end,
      });

      await this.repository.updatePedidoStatus(tx, dto.pedidoId, 'AGENDADO');
      return ag;
    });
  }

  async cancel(id: string, empresaId: string) {
    const ag = await this.repository.findAgendamentoRaw(id, empresaId);
    if (!ag) throw new NotFoundException('Agendamento não encontrado');
    if (ag.status !== 'AGENDADO') {
      throw new ConflictException(`Agendamento com status ${ag.status} não pode ser cancelado`);
    }

    return this.repository.$transaction(async (tx) => {
      const updated = await this.repository.updateAgendamentoStatus(tx, id, 'CANCELADO');
      await this.repository.updatePedidoStatus(tx, ag.pedidoId, 'CANCELADO');
      return updated;
    });
  }

  async conclude(id: string, empresaId: string) {
    const ag = await this.repository.findAgendamentoRaw(id, empresaId);
    if (!ag) throw new NotFoundException('Agendamento não encontrado');
    if (ag.status !== 'AGENDADO') {
      throw new ConflictException(`Agendamento com status ${ag.status} não pode ser concluído`);
    }

    return this.repository.$transaction(async (tx) => {
      const updated = await this.repository.updateAgendamentoStatus(tx, id, 'CONCLUIDO');
      await this.repository.updatePedidoStatus(tx, ag.pedidoId, 'CONCLUIDO');
      return updated;
    });
  }
}
