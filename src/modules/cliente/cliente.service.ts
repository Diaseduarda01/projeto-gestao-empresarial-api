import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClienteRepository } from './cliente.repository';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClienteService {
  constructor(@Inject(ClienteRepository) private repository: ClienteRepository) {}

  create(data: CreateClienteDto, empresaId: string) {
    const dataNascimento = data.dataNascimento
      ? new Date(`${data.dataNascimento}T00:00:00.000Z`)
      : undefined;
    return this.repository.create({ ...data, dataNascimento }, empresaId);
  }

  async list(empresaId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.repository.findAll(empresaId, skip, limit);
    return { data, total, page, limit };
  }

  async get(id: string, empresaId: string) {
    const cliente = await this.repository.findById(id, empresaId);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  async update(id: string, empresaId: string, data: UpdateClienteDto) {
    await this.get(id, empresaId);
    const dataNascimento = data.dataNascimento
      ? new Date(`${data.dataNascimento}T00:00:00.000Z`)
      : data.dataNascimento === null
        ? null
        : undefined;
    return this.repository.update(id, { ...data, dataNascimento } as any);
  }

  async remove(id: string, empresaId: string) {
    await this.get(id, empresaId);
    return this.repository.softDelete(id);
  }

  async historico(id: string, empresaId: string) {
    await this.get(id, empresaId);
    return this.repository.findHistorico(id, empresaId);
  }

  async aniversariantes(empresaId: string, mes?: string) {
    const mesNum = mes ? parseInt(mes, 10) : new Date().getUTCMonth() + 1;
    if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      throw new BadRequestException('Parâmetro mes deve ser um número entre 1 e 12');
    }
    const rows = await this.repository.findAniversariantes(empresaId, mesNum);
    return rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      telefone: r.telefone,
      email: r.email,
      dataNascimento: r.data_nascimento,
    }));
  }
}
