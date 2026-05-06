import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClienteRepository } from './cliente.repository';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClienteService {
  constructor(@Inject(ClienteRepository) private repository: ClienteRepository) {}

  create(data: CreateClienteDto) {
    return this.repository.create(data);
  }

  list() {
    return this.repository.findAll();
  }

  async get(id: string) {
    const cliente = await this.repository.findById(id);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  async update(id: string, data: UpdateClienteDto) {
    await this.get(id);
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.get(id);
    return this.repository.delete(id);
  }
}
