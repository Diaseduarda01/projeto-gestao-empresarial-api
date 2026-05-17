import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Sala } from '@prisma/client';
import { SalaRepository } from './sala.repository';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';

@Injectable()
export class SalaService {
  constructor(
    @Inject(SalaRepository) private repository: SalaRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private cacheKey(empresaId: string) {
    return `salas:${empresaId}`;
  }

  async list(empresaId: string, page: number, limit: number) {
    const key = this.cacheKey(empresaId);
    let all = await this.cacheManager.get<Sala[]>(key);
    if (!all) {
      all = await this.repository.findAll(empresaId);
      await this.cacheManager.set(key, all, 60000);
    }
    const total = all.length;
    const data = all.slice((page - 1) * limit, page * limit);
    return { data, total, page, limit };
  }

  async get(id: string, empresaId: string) {
    const sala = await this.repository.findById(id, empresaId);
    if (!sala) throw new NotFoundException('Sala não encontrada');
    return sala;
  }

  async create(data: CreateSalaDto, empresaId: string) {
    const result = await this.repository.create(data, empresaId);
    await this.cacheManager.del(this.cacheKey(empresaId));
    return result;
  }

  async update(id: string, empresaId: string, data: UpdateSalaDto) {
    await this.get(id, empresaId);
    const result = await this.repository.update(id, data);
    await this.cacheManager.del(this.cacheKey(empresaId));
    return result;
  }

  async remove(id: string, empresaId: string) {
    await this.get(id, empresaId);
    const agFuturo = await this.repository.findAgendamentoFuturo(id, empresaId);
    if (agFuturo) throw new ConflictException('Sala possui agendamentos futuros e não pode ser removida');
    await this.repository.softDelete(id);
    await this.cacheManager.del(this.cacheKey(empresaId));
  }
}
