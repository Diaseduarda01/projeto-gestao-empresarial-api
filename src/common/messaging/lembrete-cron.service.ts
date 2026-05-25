import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { MessagingService } from './messaging.service';
import { ERP_ROUTING_KEY, AgendamentoLembrete24hEvent } from './erp-events';

@Injectable()
export class LembreteCronService {
  private readonly logger = new Logger(LembreteCronService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MessagingService) private readonly messaging: MessagingService,
  ) {}

  // Roda diariamente às 08:00 UTC e envia lembretes para agendamentos do dia seguinte
  @Cron('0 8 * * *')
  async enviarLembretes() {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const tomorrowEnd = new Date(tomorrow.getTime() + 86_399_999); // 23:59:59.999

    this.logger.log(`Cron lembrete 24h: buscando agendamentos para ${tomorrow.toISOString().substring(0, 10)}`);

    const agendamentos = await this.prisma.agendamento.findMany({
      where: { status: 'AGENDADO', data: { gte: tomorrow, lte: tomorrowEnd } },
      include: {
        funcionario: { select: { nome: true } },
        pedido: { include: { cliente: true, servicos: { include: { servico: true } } } },
      },
    });

    for (const ag of agendamentos) {
      const servicoNome = ag.pedido.servicos.map((ps) => ps.servico.nome).join(', ');
      const event: AgendamentoLembrete24hEvent = {
        agendamentoId: ag.id,
        empresaId: ag.empresaId,
        clienteId: ag.pedido.cliente.id,
        clienteNome: ag.pedido.cliente.nome,
        clienteTelefone: ag.pedido.cliente.telefone,
        funcionarioNome: ag.funcionario.nome,
        servicoNome,
        horaInicio: ag.horaInicio.toISOString(),
      };
      await this.messaging.publish(ERP_ROUTING_KEY.AGENDAMENTO_LEMBRETE, event);
    }

    this.logger.log(`Cron lembrete 24h: ${agendamentos.length} lembretes publicados`);
  }
}
