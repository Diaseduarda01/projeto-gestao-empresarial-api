import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SalaRepository } from './sala.repository';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';

@Injectable()
export class SalaService {
  constructor(@Inject(SalaRepository) private repository: SalaRepository) {}

  list() {
    return this.repository.findAll();
  }

  async get(id: string) {
    const sala = await this.repository.findById(id);
    if (!sala) throw new NotFoundException('Sala não encontrada');
    return sala;
  }

  create(data: CreateSalaDto) {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateSalaDto) {
    await this.get(id);
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.get(id);
    const agFuturo = await this.repository.findAgendamentoFuturo(id);
    if (agFuturo) throw new ConflictException('Sala possui agendamentos futuros e não pode ser removida');
    await this.repository.delete(id);
  }
}
