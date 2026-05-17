import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ChatbotRepository } from './chatbot.repository';
import { ChatbotClienteDto } from './dto/chatbot.dto';

const HORA_INICIO_MIN = 8 * 60;   // 08:00
const HORA_FIM_MIN = 18 * 60;     // 18:00
const SLOT_STEP_MIN = 30;

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

@Injectable()
export class ChatbotService {
  constructor(@Inject(ChatbotRepository) private repository: ChatbotRepository) {}

  async listarServicos(empresaId: string) {
    return this.repository.findServicos(empresaId);
  }

  async buscarOuCriarCliente(dto: ChatbotClienteDto) {
    return this.repository.upsertCliente({
      empresaId: dto.empresaId,
      nome: dto.nome,
      telefone: dto.telefone,
      email: dto.email,
    });
  }

  async disponibilidade(empresaId: string, servicoId: string, data: string): Promise<string[]> {
    const servico = await this.repository.findServico(servicoId, empresaId);
    if (!servico) throw new NotFoundException('Serviço não encontrado');

    const funcIds = await this.repository.findFuncionariosComEspecialidade(servicoId, empresaId);
    if (!funcIds.length) return [];

    const salas = await this.repository.findSalasAtivas(empresaId);
    if (!salas.length) return [];

    const salaIds = salas.map((s) => s.id);
    const dataStart = new Date(`${data}T00:00:00.000Z`);
    const dataEnd = new Date(`${data}T23:59:59.999Z`);
    const agendamentos = await this.repository.findAgendamentosNoDia(
      empresaId, funcIds, salaIds, dataStart, dataEnd,
    );

    const slots: string[] = [];
    for (let min = HORA_INICIO_MIN; min + servico.duracao <= HORA_FIM_MIN; min += SLOT_STEP_MIN) {
      const hh = Math.floor(min / 60);
      const mm = min % 60;
      const slotStart = new Date(`${data}T${pad(hh)}:${pad(mm)}:00.000Z`);
      const slotEnd = new Date(slotStart.getTime() + servico.duracao * 60_000);

      const funcLivre = funcIds.some((fId) =>
        !agendamentos.some(
          (ag) => ag.funcionarioId === fId && ag.horaInicio < slotEnd && ag.horaFim > slotStart,
        ),
      );
      const salaLivre = salaIds.some((sId) =>
        !agendamentos.some(
          (ag) => ag.salaId === sId && ag.horaInicio < slotEnd && ag.horaFim > slotStart,
        ),
      );

      if (funcLivre && salaLivre) {
        slots.push(`${pad(hh)}:${pad(mm)}`);
      }
    }
    return slots;
  }

  async listarAgendamentos(empresaId: string, clienteId: string) {
    const agendamentos = await this.repository.findAgendamentosDoCliente(empresaId, clienteId);
    return agendamentos.map((ag) => ({
      id: ag.id,
      data: ag.data.toISOString().substring(0, 10),
      horaInicio: ag.horaInicio.toISOString().substring(11, 16),
      nomeServico: ag.pedido.servicos.map((s) => s.servico.nome).join(', '),
      status: ag.status,
    }));
  }

  async cancelarAgendamento(agendamentoId: string) {
    return this.repository.cancelarAgendamento(agendamentoId);
  }

  async criarAgendamento(params: {
    empresaId: string;
    clienteId: string;
    servicoId: string;
    data: string;
    horaInicio: string;
  }) {
    const servico = await this.repository.findServico(params.servicoId, params.empresaId);
    if (!servico) throw new NotFoundException('Serviço não encontrado');

    const start = new Date(`${params.data}T${params.horaInicio}:00.000Z`);
    const end = new Date(start.getTime() + servico.duracao * 60_000);

    const funcIds = await this.repository.findFuncionariosComEspecialidade(
      params.servicoId, params.empresaId,
    );

    const salas = await this.repository.findSalasAtivas(params.empresaId);
    if (!salas.length) throw new ConflictException('Nenhuma sala disponível');

    const salaIds = salas.map((s) => s.id);
    const agendamentos = await this.repository.findAgendamentosNoDia(
      params.empresaId, funcIds, salaIds,
      new Date(`${params.data}T00:00:00.000Z`),
      new Date(`${params.data}T23:59:59.999Z`),
    );

    const funcId = funcIds.find(
      (fId) =>
        !agendamentos.some(
          (ag) => ag.funcionarioId === fId && ag.horaInicio < end && ag.horaFim > start,
        ),
    );
    if (!funcId) throw new ConflictException('Nenhum profissional disponível neste horário');

    const salaId = salaIds.find(
      (sId) =>
        !agendamentos.some(
          (ag) => ag.salaId === sId && ag.horaInicio < end && ag.horaFim > start,
        ),
    );
    if (!salaId) throw new ConflictException('Nenhuma sala disponível neste horário');

    return this.repository.criarPedidoEAgendamento({
      clienteId: params.clienteId,
      servicoId: params.servicoId,
      funcionarioId: funcId,
      salaId,
      empresaId: params.empresaId,
      data: new Date(`${params.data}T00:00:00.000Z`),
      horaInicio: start,
      horaFim: end,
      nomeServico: servico.nome,
    });
  }
}
