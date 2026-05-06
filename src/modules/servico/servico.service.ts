import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ServicoRepository } from './servico.repository';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';

@Injectable()
export class ServicoService {
  constructor(@Inject(ServicoRepository) private repository: ServicoRepository) {}

  list() {
    return this.repository.findAll();
  }

  async get(id: string) {
    const servico = await this.repository.findById(id);
    if (!servico) throw new NotFoundException('Serviço não encontrado');
    return servico;
  }

  create(data: CreateServicoDto) {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateServicoDto) {
    await this.get(id);
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.get(id);
    const emUso = await this.repository.findPedidoServico(id);
    if (emUso) throw new ConflictException('Serviço está vinculado a pedidos e não pode ser removido');
    await this.repository.delete(id);
  }
}
