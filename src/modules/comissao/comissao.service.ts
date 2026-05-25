import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ComissaoRepository } from './comissao.repository';
import { UpsertComissaoDto } from './dto/upsert-comissao.dto';

@Injectable()
export class ComissaoService {
  constructor(@Inject(ComissaoRepository) private repo: ComissaoRepository) {}

  upsert(empresaId: string, dto: UpsertComissaoDto) {
    return this.repo.upsert(empresaId, {
      funcionarioId: dto.funcionarioId,
      servicoId: dto.servicoId ?? null,
      percentual: dto.percentual,
    });
  }

  findAll(empresaId: string, funcionarioId?: string) {
    return this.repo.findAll(empresaId, funcionarioId);
  }

  async remove(id: string, empresaId: string) {
    const comissao = await this.repo.findById(id, empresaId);
    if (!comissao) throw new NotFoundException('Regra de comissão não encontrada');
    return this.repo.delete(id);
  }

  async relatorio(empresaId: string, funcionarioId: string, mes: string) {
    const regras = await this.repo.findAll(empresaId, funcionarioId);
    const agendamentos = await this.repo.relatorioMes(empresaId, funcionarioId, mes);

    const percentualGlobal = regras.find((r) => !r.servicoId)?.percentual;

    let totalServicos = 0;
    let totalComissao = 0;
    const detalhe: any[] = [];

    for (const ag of agendamentos) {
      for (const ps of ag.pedido.servicos) {
        const preco = Number(ps.servico.preco);
        const regraServico = regras.find((r) => r.servicoId === ps.servico.id);
        const percentual = Number(regraServico?.percentual ?? percentualGlobal ?? 0);
        const comissao = Number(((preco * percentual) / 100).toFixed(2));

        totalServicos += preco;
        totalComissao += comissao;
        detalhe.push({
          agendamentoId: ag.id,
          data: ag.data,
          servico: ps.servico.nome,
          preco,
          percentual,
          comissao,
        });
      }
    }

    return {
      mes,
      funcionarioId,
      totalServicos: Number(totalServicos.toFixed(2)),
      totalComissao: Number(totalComissao.toFixed(2)),
      agendamentos: agendamentos.length,
      detalhe,
    };
  }
}
