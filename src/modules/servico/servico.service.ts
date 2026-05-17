import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Servico } from '@prisma/client';
import { ServicoRepository } from './servico.repository';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';

@Injectable()
export class ServicoService {
  constructor(
    @Inject(ServicoRepository) private repository: ServicoRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private cacheKey(empresaId: string) {
    return `servicos:${empresaId}`;
  }

  async list(empresaId: string, page: number, limit: number) {
    const key = this.cacheKey(empresaId);
    let all = await this.cacheManager.get<Servico[]>(key);
    if (!all) {
      all = await this.repository.findAll(empresaId);
      await this.cacheManager.set(key, all, 60000);
    }
    const total = all.length;
    const data = all.slice((page - 1) * limit, page * limit);
    return { data, total, page, limit };
  }

  async get(id: string, empresaId: string) {
    const servico = await this.repository.findById(id, empresaId);
    if (!servico) throw new NotFoundException('Serviço não encontrado');
    return servico;
  }

  async create(data: CreateServicoDto, empresaId: string) {
    const result = await this.repository.create(data, empresaId);
    await this.cacheManager.del(this.cacheKey(empresaId));
    return result;
  }

  async update(id: string, empresaId: string, data: UpdateServicoDto) {
    await this.get(id, empresaId);
    const result = await this.repository.update(id, data);
    await this.cacheManager.del(this.cacheKey(empresaId));
    return result;
  }

  async remove(id: string, empresaId: string) {
    await this.get(id, empresaId);
    await this.repository.softDelete(id);
    await this.cacheManager.del(this.cacheKey(empresaId));
  }
}
