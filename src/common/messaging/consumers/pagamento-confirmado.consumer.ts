import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { MessagingService } from '../messaging.service';
import { ERP_CONSUME_QUEUE, PagamentoConfirmadoEvent } from '../erp-events';

@Injectable()
export class PagamentoConfirmadoConsumer implements OnModuleInit {
  private readonly logger = new Logger(PagamentoConfirmadoConsumer.name);

  constructor(
    @Inject(MessagingService) private readonly messaging: MessagingService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.messaging.consume(ERP_CONSUME_QUEUE.PAGAMENTO_CONFIRMADO, (payload) =>
      this.handle(payload as PagamentoConfirmadoEvent),
    );
  }

  private async handle(event: PagamentoConfirmadoEvent) {
    this.logger.log(
      `Pagamento confirmado — cobrancaId=${event.cobrancaId} agendamentoId=${event.agendamentoId}`,
    );

    const pagamento = await this.prisma.pagamento.findFirst({
      where: { id: event.cobrancaId, empresaId: event.empresaId },
    });

    if (!pagamento) {
      this.logger.warn(`Pagamento não encontrado: ${event.cobrancaId}`);
      return;
    }

    if (pagamento.status === 'CONFIRMADO') {
      this.logger.warn(`Pagamento ${event.cobrancaId} já está confirmado — ignorando`);
      return;
    }

    await this.prisma.pagamento.update({
      where: { id: event.cobrancaId },
      data: {
        status: 'CONFIRMADO',
        pagoEm: new Date(event.pagoEm),
      },
    });

    this.logger.log(`Pagamento ${event.cobrancaId} atualizado para CONFIRMADO`);
  }
}
