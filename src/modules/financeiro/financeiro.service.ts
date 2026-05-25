import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { FinanceiroRepository } from './financeiro.repository';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';

@Injectable()
export class FinanceiroService {
  constructor(@Inject(FinanceiroRepository) private repo: FinanceiroRepository) {}

  create(empresaId: string, dto: CreatePagamentoDto) {
    return this.repo.create(empresaId, {
      agendamentoId: dto.agendamentoId,
      clienteId: dto.clienteId,
      valor: dto.valor,
      desconto: dto.desconto,
      formaPagamento: dto.formaPagamento as any,
      observacoes: dto.observacoes,
    });
  }

  findAll(empresaId: string, status?: string, data?: string) {
    return this.repo.findAll(empresaId, { status: status as any, data });
  }

  async findById(id: string, empresaId: string) {
    const pagamento = await this.repo.findById(id, empresaId);
    if (!pagamento) throw new NotFoundException('Pagamento não encontrado');
    return pagamento;
  }

  async confirmar(id: string, empresaId: string) {
    const pagamento = await this.findById(id, empresaId);
    if (pagamento.status !== 'PENDENTE') {
      throw new ConflictException(`Pagamento não pode ser confirmado — status atual: ${pagamento.status}`);
    }
    return this.repo.updateStatus(id, empresaId, 'CONFIRMADO', new Date());
  }

  async cancelar(id: string, empresaId: string) {
    const pagamento = await this.findById(id, empresaId);
    if (pagamento.status === 'CANCELADO') {
      throw new ConflictException('Pagamento já cancelado');
    }
    return this.repo.updateStatus(id, empresaId, 'CANCELADO');
  }

  async relatorio(empresaId: string, inicio: string, fim: string) {
    const inicioDate = new Date(`${inicio}T00:00:00.000Z`);
    const fimDate = new Date(`${fim}T23:59:59.999Z`);
    const pagamentos = await this.repo.relatorio(empresaId, inicioDate, fimDate);

    const porFuncionario = new Map<string, any>();
    const porServico = new Map<string, { nome: string; quantidade: number; total: number }>();
    let totalGeral = 0;

    for (const p of pagamentos) {
      const valor = Number(p.valor) - Number(p.desconto ?? 0);
      totalGeral += valor;

      if (!p.agendamento) continue;

      const func = p.agendamento.funcionario;
      if (!porFuncionario.has(func.id)) {
        porFuncionario.set(func.id, {
          funcionarioId: func.id,
          funcionarioNome: func.nome,
          totalRecebido: 0,
          quantidadeAtendimentos: 0,
          servicos: new Map<string, any>(),
        });
      }
      const fEntry = porFuncionario.get(func.id)!;
      fEntry.totalRecebido += valor;
      fEntry.quantidadeAtendimentos += 1;

      for (const ps of p.agendamento.pedido.servicos) {
        const preco = Number(ps.servico.preco);
        const sId = ps.servico.id;
        if (!fEntry.servicos.has(sId)) {
          fEntry.servicos.set(sId, { servicoNome: ps.servico.nome, quantidade: 0, total: 0 });
        }
        fEntry.servicos.get(sId).quantidade += 1;
        fEntry.servicos.get(sId).total += preco;

        if (!porServico.has(sId)) {
          porServico.set(sId, { nome: ps.servico.nome, quantidade: 0, total: 0 });
        }
        porServico.get(sId)!.quantidade += 1;
        porServico.get(sId)!.total += preco;
      }
    }

    return {
      periodo: { inicio, fim },
      totalGeral: Number(totalGeral.toFixed(2)),
      quantidadePagamentos: pagamentos.length,
      porFuncionario: [...porFuncionario.values()].map((f) => ({
        ...f,
        totalRecebido: Number(f.totalRecebido.toFixed(2)),
        servicos: [...f.servicos.values()],
      })),
      porServico: [...porServico.values()].map((s) => ({
        ...s,
        total: Number(s.total.toFixed(2)),
      })),
    };
  }

  async comissoes(empresaId: string, funcionarioId: string, mes: string) {
    const [ano, mesNum] = mes.split('-').map(Number);
    const inicio = new Date(Date.UTC(ano, mesNum - 1, 1));
    const fim = new Date(Date.UTC(ano, mesNum, 0, 23, 59, 59, 999));

    const [agendamentos, regras] = await Promise.all([
      this.repo.comissoesAgendamentos(empresaId, funcionarioId, inicio, fim),
      this.repo.comissoesRegras(empresaId, funcionarioId),
    ]);

    const regrasMap = new Map(regras.map((r) => [r.servicoId ?? '__global__', Number(r.percentual)]));
    const percentualGlobal = regrasMap.get('__global__') ?? 0;

    let totalComissao = 0;
    const detalhes: any[] = [];

    for (const ag of agendamentos) {
      for (const ps of ag.pedido.servicos) {
        const preco = Number(ps.servico.preco);
        const percentual = regrasMap.get(ps.servico.id) ?? percentualGlobal;
        const valorComissao = Number((preco * percentual / 100).toFixed(2));
        totalComissao += valorComissao;
        detalhes.push({
          agendamentoId: ag.id,
          data: ag.data.toISOString().substring(0, 10),
          servicoNome: ps.servico.nome,
          valorServico: preco,
          percentual,
          valorComissao,
        });
      }
    }

    return {
      mes,
      funcionarioId,
      totalComissao: Number(totalComissao.toFixed(2)),
      quantidadeAtendimentos: agendamentos.length,
      detalhes,
    };
  }

  async caixaDia(empresaId: string, data: string) {
    const pagamentos = await this.repo.caixaDia(empresaId, data);

    const totais: Record<string, number> = {};
    let totalBruto = 0;
    let totalDesconto = 0;

    for (const p of pagamentos) {
      const valor = Number(p.valor);
      const desconto = Number(p.desconto ?? 0);
      const liquido = valor - desconto;
      totalBruto += valor;
      totalDesconto += desconto;
      totais[p.formaPagamento] = (totais[p.formaPagamento] ?? 0) + liquido;
    }

    return {
      data,
      totalBruto: Number(totalBruto.toFixed(2)),
      totalDesconto: Number(totalDesconto.toFixed(2)),
      totalLiquido: Number((totalBruto - totalDesconto).toFixed(2)),
      quantidadePagamentos: pagamentos.length,
      porFormaPagamento: totais,
    };
  }
}
