import { Injectable, Inject } from '@nestjs/common';
import { MovimentoTipo } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EstoqueRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  createProduto(empresaId: string, data: {
    nome: string;
    descricao?: string;
    unidade: string;
    estoqueMinimoAlerta: number;
    preco?: number;
  }) {
    return this.prisma.produto.create({ data: { ...data, empresaId } });
  }

  findAllProdutos(empresaId: string, apenasAtivos = true) {
    return this.prisma.produto.findMany({
      where: { empresaId, deletedAt: null, ...(apenasAtivos ? { ativo: true } : {}) },
      orderBy: { nome: 'asc' },
    });
  }

  findProdutoById(id: string, empresaId: string) {
    return this.prisma.produto.findFirst({
      where: { id, empresaId, deletedAt: null },
    });
  }

  updateProduto(id: string, data: {
    nome?: string;
    descricao?: string;
    unidade?: string;
    estoqueMinimoAlerta?: number;
    preco?: number;
    ativo?: boolean;
  }) {
    return this.prisma.produto.update({ where: { id }, data });
  }

  softDeleteProduto(id: string) {
    return this.prisma.produto.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  findAlertasEstoque(empresaId: string) {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, nome, unidade, "estoque_atual", "estoque_minimo_alerta"
      FROM produtos
      WHERE empresa_id = ${empresaId}
        AND deleted_at IS NULL
        AND ativo = true
        AND estoque_atual <= estoque_minimo_alerta
      ORDER BY nome
    `;
  }

  async registrarMovimento(empresaId: string, funcionarioId: string, data: {
    produtoId: string;
    tipo: MovimentoTipo;
    quantidade: number;
    referencia?: string;
    agendamentoId?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const delta = data.tipo === 'SAIDA' ? -data.quantidade : data.quantidade;
      await tx.produto.update({
        where: { id: data.produtoId },
        data: { estoqueAtual: { increment: delta } },
      });
      return tx.movimentoEstoque.create({
        data: { ...data, empresaId, funcionarioId },
      });
    });
  }

  findMovimentos(produtoId: string, empresaId: string) {
    return this.prisma.movimentoEstoque.findMany({
      where: { produtoId, empresaId },
      orderBy: { criadoEm: 'desc' },
      take: 100,
    });
  }
}
