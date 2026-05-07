import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { FuncionarioRepository } from './funcionario.repository';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { AddServicosDto } from './dto/add-servicos.dto';

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
}
