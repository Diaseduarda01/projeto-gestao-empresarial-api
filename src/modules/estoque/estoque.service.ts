import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { EstoqueRepository } from './estoque.repository';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { CreateMovimentoDto } from './dto/create-movimento.dto';

@Injectable()
export class EstoqueService {
  constructor(@Inject(EstoqueRepository) private repo: EstoqueRepository) {}

  createProduto(empresaId: string, dto: CreateProdutoDto) {
    return this.repo.createProduto(empresaId, {
      nome: dto.nome,
      descricao: dto.descricao,
      unidade: dto.unidade ?? 'un',
      estoqueMinimoAlerta: dto.estoqueMinimoAlerta ?? 0,
      preco: dto.preco,
    });
  }

  findAll(empresaId: string) {
    return this.repo.findAllProdutos(empresaId);
  }

  async findById(id: string, empresaId: string) {
    const produto = await this.repo.findProdutoById(id, empresaId);
    if (!produto) throw new NotFoundException('Produto não encontrado');
    return produto;
  }

  async update(id: string, empresaId: string, dto: UpdateProdutoDto) {
    await this.findById(id, empresaId);
    return this.repo.updateProduto(id, dto);
  }

  async remove(id: string, empresaId: string) {
    await this.findById(id, empresaId);
    return this.repo.softDeleteProduto(id);
  }

  findAlertas(empresaId: string) {
    return this.repo.findAlertasEstoque(empresaId);
  }

  async registrarMovimento(empresaId: string, funcionarioId: string, dto: CreateMovimentoDto) {
    const produto = await this.repo.findProdutoById(dto.produtoId, empresaId);
    if (!produto) throw new NotFoundException('Produto não encontrado');

    if (dto.tipo === 'SAIDA' && Number(produto.estoqueAtual) < dto.quantidade) {
      throw new ConflictException(
        `Estoque insuficiente: disponível ${produto.estoqueAtual}, solicitado ${dto.quantidade}`,
      );
    }

    return this.repo.registrarMovimento(empresaId, funcionarioId, {
      produtoId: dto.produtoId,
      tipo: dto.tipo as any,
      quantidade: dto.quantidade,
      referencia: dto.referencia,
      agendamentoId: dto.agendamentoId,
    });
  }

  async findMovimentos(produtoId: string, empresaId: string) {
    await this.findById(produtoId, empresaId);
    return this.repo.findMovimentos(produtoId, empresaId);
  }
}
