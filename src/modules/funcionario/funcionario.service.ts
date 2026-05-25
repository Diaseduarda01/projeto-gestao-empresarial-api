import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { FuncionarioRepository } from './funcionario.repository';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { AddServicosDto } from './dto/add-servicos.dto';
import { UpsertHorarioTrabalhoDto } from './dto/horario-trabalho.dto';
import { CreateBloqueioAgendaDto } from './dto/bloqueio-agenda.dto';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

@Injectable()
export class FuncionarioService {
  constructor(@Inject(FuncionarioRepository) private repository: FuncionarioRepository) {}

  async list(empresaId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.repository.findAll(empresaId, skip, limit);
    return {
      data: data.map((v) => ({ ...v.funcionario, papel: v.papel })),
      total,
      page,
      limit,
    };
  }

  async get(id: string, empresaId: string) {
    const vinculo = await this.repository.findById(id, empresaId);
    if (!vinculo) throw new NotFoundException('Funcionário não encontrado nesta empresa');
    return { ...vinculo.funcionario, papel: vinculo.papel };
  }

  async create(data: CreateFuncionarioDto, empresaId: string) {
    const senha = await bcrypt.hash(data.senha, 10);
    const papel = (data.papel as Role | undefined) ?? Role.ATENDENTE;
    return this.repository.create({ nome: data.nome, email: data.email, senha }, empresaId, papel);
  }

  async update(id: string, empresaId: string, data: UpdateFuncionarioDto) {
    await this.get(id, empresaId);
    const payload: Partial<{ nome: string; email: string; senha: string }> = { ...data };
    if (data.senha) payload.senha = await bcrypt.hash(data.senha, 10);
    return this.repository.update(id, payload);
  }

  async remove(id: string, empresaId: string) {
    await this.get(id, empresaId);
    const agFuturo = await this.repository.findAgendamentoFuturo(id, empresaId);
    if (agFuturo) {
      throw new ConflictException('Funcionário possui agendamentos futuros e não pode ser removido');
    }
    await this.repository.removeFromEmpresa(id, empresaId);
  }

  listServicos(id: string) {
    return this.repository.findServicos(id);
  }

  async addServicos(id: string, empresaId: string, dto: AddServicosDto) {
    await this.get(id, empresaId);
    const servicos = await this.repository.findServicosByIds(dto.servicoIds, empresaId);
    if (servicos.length !== dto.servicoIds.length) {
      throw new NotFoundException('Um ou mais serviços não encontrados nesta empresa');
    }
    await this.repository.addServicos(id, dto.servicoIds);
    return this.repository.findServicos(id);
  }

  async removeServico(id: string, empresaId: string, servicoId: string) {
    await this.get(id, empresaId);
    await this.repository.removeServico(id, servicoId);
  }

  // HorarioTrabalho

  async listHorariosTrabalho(id: string, empresaId: string) {
    await this.get(id, empresaId);
    return this.repository.listHorariosTrabalho(id, empresaId);
  }

  async upsertHorarioTrabalho(id: string, empresaId: string, diaSemana: number, dto: UpsertHorarioTrabalhoDto) {
    if (diaSemana < 0 || diaSemana > 6) {
      throw new BadRequestException('diaSemana deve ser um número entre 0 (domingo) e 6 (sábado)');
    }
    await this.get(id, empresaId);
    return this.repository.upsertHorarioTrabalho(id, empresaId, diaSemana, dto);
  }

  async removeHorarioTrabalho(id: string, empresaId: string, diaSemana: number) {
    await this.get(id, empresaId);
    await this.repository.removeHorarioTrabalho(id, empresaId, diaSemana);
  }

  // BloqueioAgenda

  async listBloqueios(id: string, empresaId: string) {
    await this.get(id, empresaId);
    return this.repository.listBloqueios(id, empresaId);
  }

  async createBloqueio(id: string, empresaId: string, dto: CreateBloqueioAgendaDto) {
    await this.get(id, empresaId);
    return this.repository.createBloqueio({
      funcionarioId: id,
      empresaId,
      data: new Date(`${dto.data}T00:00:00.000Z`),
      horaInicio: dto.horaInicio,
      horaFim: dto.horaFim,
      motivo: dto.motivo,
    });
  }

  async removeBloqueio(id: string, empresaId: string, bloqueioId: string) {
    await this.get(id, empresaId);
    await this.repository.removeBloqueio(bloqueioId, empresaId);
  }

  // Disponibilidade

  async disponibilidade(id: string, empresaId: string, data: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      throw new BadRequestException('Parâmetro data deve estar no formato YYYY-MM-DD');
    }

    await this.get(id, empresaId);
    const { horarioTrabalho, agendamentos, bloqueios } = await this.repository.findDisponibilidade(id, empresaId, data);

    if (!horarioTrabalho) {
      return { data, slots: [], motivo: 'sem_horario_cadastrado' };
    }

    const diaTodoBloqueado = bloqueios.some((b) => !b.horaInicio && !b.horaFim);
    if (diaTodoBloqueado) {
      return { data, slots: [], motivo: 'dia_bloqueado' };
    }

    const [startH, startM] = horarioTrabalho.horaInicio.split(':').map(Number);
    const [endH, endM] = horarioTrabalho.horaFim.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    const slots: string[] = [];

    for (let min = startMin; min + 30 <= endMin; min += 30) {
      const hh = Math.floor(min / 60);
      const mm = min % 60;
      const slotStart = new Date(`${data}T${pad(hh)}:${pad(mm)}:00.000Z`);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60_000);

      const agConflito = agendamentos.some(
        (ag) => ag.horaInicio < slotEnd && ag.horaFim > slotStart,
      );

      const bloqConflito = bloqueios.some((b) => {
        if (!b.horaInicio || !b.horaFim) return false;
        const [bStartH, bStartM] = b.horaInicio.split(':').map(Number);
        const [bEndH, bEndM] = b.horaFim.split(':').map(Number);
        const bStartMin = bStartH * 60 + bStartM;
        const bEndMin = bEndH * 60 + bEndM;
        const slotStartMin = hh * 60 + mm;
        const slotEndMin = slotStartMin + 30;
        return slotStartMin < bEndMin && slotEndMin > bStartMin;
      });

      if (!agConflito && !bloqConflito) {
        slots.push(`${pad(hh)}:${pad(mm)}`);
      }
    }

    return { data, horarioTrabalho: { inicio: horarioTrabalho.horaInicio, fim: horarioTrabalho.horaFim }, slots };
  }
}
