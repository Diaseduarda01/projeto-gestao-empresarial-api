import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PedidoRepository } from './pedido.repository';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { AddServicosPedidoDto } from './dto/add-servicos-pedido.dto';

@Injectable()
export class PedidoService {
  constructor(@Inject(PedidoRepository) private repository: PedidoRepository) {}

  async list(empresaId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.repository.findAll(empresaId, skip, limit);
    return { data, total, page, limit };
  }

  async get(id: string, empresaId: string) {
    const pedido = await this.repository.findById(id, empresaId);
    if (!pedido) throw new NotFoundException('Pedido não encontrado');
    return pedido;
  }

  async create(data: CreatePedidoDto, empresaId: string) {
    const cliente = await this.repository.findClienteById(data.clienteId, empresaId);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    const servicos = await this.repository.findServicosByIds(data.servicoIds, empresaId);
    if (servicos.length !== data.servicoIds.length) {
      throw new NotFoundException('Um ou mais serviços não encontrados');
    }

    return this.repository.create(data.clienteId, data.servicoIds, empresaId);
  }

  async addServicos(id: string, empresaId: string, dto: AddServicosPedidoDto) {
    const pedido = await this.repository.findPedidoRaw(id, empresaId);
    if (!pedido) throw new NotFoundException('Pedido não encontrado');
    if (pedido.status !== 'ABERTO') {
      throw new ConflictException(`Não é possível adicionar serviços a um pedido com status ${pedido.status}`);
    }

    const servicos = await this.repository.findServicosByIds(dto.servicoIds, empresaId);
    if (servicos.length !== dto.servicoIds.length) {
      throw new NotFoundException('Um ou mais serviços não encontrados');
    }

    await this.repository.addServicos(id, dto.servicoIds);
    return this.repository.findById(id, empresaId);
  }

  async cancel(id: string, empresaId: string) {
    const pedido = await this.repository.findPedidoRaw(id, empresaId);
    if (!pedido) throw new NotFoundException('Pedido não encontrado');
    if (pedido.status === 'CANCELADO') throw new ConflictException('Pedido já está cancelado');
    if (pedido.status === 'CONCLUIDO') throw new ConflictException('Pedido concluído não pode ser cancelado');
    return this.repository.updateStatus(id, 'CANCELADO');
  }
}
