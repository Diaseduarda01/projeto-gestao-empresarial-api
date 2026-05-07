import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClienteRepository } from './cliente.repository';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClienteService {
  constructor(@Inject(ClienteRepository) private repository: ClienteRepository) {}

  create(data: CreateClienteDto, empresaId: string) {
    return this.repository.create(data, empresaId);
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
    return this.repository.update(id, data);
  }

  async remove(id: string, empresaId: string) {
    await this.get(id, empresaId);
    return this.repository.delete(id);
  }
}
