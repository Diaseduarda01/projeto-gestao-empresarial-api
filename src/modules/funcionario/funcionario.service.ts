import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { FuncionarioRepository } from './funcionario.repository';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { AddServicosDto } from './dto/add-servicos.dto';

@Injectable()
export class FuncionarioService {
  constructor(@Inject(FuncionarioRepository) private repository: FuncionarioRepository) {}

  list() {
    return this.repository.findAll();
  }

  async get(id: string) {
    const funcionario = await this.repository.findById(id);
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado');
    return funcionario;
  }

  async create(data: CreateFuncionarioDto) {
    const senha = await bcrypt.hash(data.senha, 10);
    return this.repository.create({ ...data, senha });
  }

  async update(id: string, data: UpdateFuncionarioDto) {
    await this.get(id);
    const payload: Partial<{ nome: string; email: string; senha: string }> = { ...data };
    if (data.senha) {
      payload.senha = await bcrypt.hash(data.senha, 10);
    }
    return this.repository.update(id, payload);
  }

  async remove(id: string) {
    await this.get(id);
    const agFuturo = await this.repository.findAgendamentoFuturo(id);
    if (agFuturo) {
      throw new ConflictException('Funcionário possui agendamentos futuros e não pode ser removido');
    }
    await this.repository.delete(id);
  }

  listServicos(id: string) {
    return this.repository.findServicos(id);
  }

  async addServicos(id: string, dto: AddServicosDto) {
    await this.get(id);
    const servicos = await this.repository.findServicosByIds(dto.servicoIds);
    if (servicos.length !== dto.servicoIds.length) {
      throw new NotFoundException('Um ou mais serviços não encontrados');
    }
    await this.repository.addServicos(id, dto.servicoIds);
    return this.repository.findServicos(id);
  }

  async removeServico(id: string, servicoId: string) {
    await this.get(id);
    await this.repository.removeServico(id, servicoId);
  }
}
