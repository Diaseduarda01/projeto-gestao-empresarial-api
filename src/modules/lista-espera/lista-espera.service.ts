import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ListaEsperaRepository } from './lista-espera.repository';
import { CreateListaEsperaDto } from './dto/lista-espera.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ListaEsperaService {
  constructor(@Inject(ListaEsperaRepository) private repository: ListaEsperaRepository) {}

  async create(dto: CreateListaEsperaDto, empresaId: string) {
    return this.repository.create({
      clienteId: dto.clienteId,
      empresaId,
      servicoId: dto.servicoId,
      funcionarioId: dto.funcionarioId,
      dataDesejada: new Date(`${dto.dataDesejada}T00:00:00.000Z`),
    });
  }

  async list(empresaId: string, pagination: PaginationDto, atendida?: string) {
    const skip = (pagination.page - 1) * pagination.limit;
    const filtroAtendida = atendida === 'true' ? true : atendida === 'false' ? false : undefined;
    const { data, total } = await this.repository.findAll(empresaId, skip, pagination.limit, filtroAtendida);
    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  async atender(id: string, empresaId: string) {
    const entrada = await this.repository.findById(id, empresaId);
    if (!entrada) throw new NotFoundException('Entrada na lista de espera não encontrada');
    return this.repository.marcarAtendida(id);
  }

  async remove(id: string, empresaId: string) {
    const entrada = await this.repository.findById(id, empresaId);
    if (!entrada) throw new NotFoundException('Entrada na lista de espera não encontrada');
    return this.repository.remove(id);
  }
}
