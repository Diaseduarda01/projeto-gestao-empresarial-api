import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { MessagingService } from '../messaging.service';
import { ERP_CONSUME_QUEUE, RelatorioProntoEvent } from '../erp-events';

@Injectable()
export class RelatorioProntoConsumer implements OnModuleInit {
  private readonly logger = new Logger(RelatorioProntoConsumer.name);

  constructor(
    @Inject(MessagingService) private readonly messaging: MessagingService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.messaging.consume(ERP_CONSUME_QUEUE.RELATORIO_PRONTO, (payload) =>
      this.handle(payload as RelatorioProntoEvent),
    );
  }

  private async handle(event: RelatorioProntoEvent) {
    this.logger.log(
      `Relatório pronto — relatorioId=${event.relatorioId} solicitante=${event.solicitanteId}`,
    );

    const funcionario = await this.prisma.funcionario.findUnique({
      where: { id: event.solicitanteId },
      select: { nome: true, email: true },
    });

    if (!funcionario) {
      this.logger.warn(`Solicitante não encontrado: ${event.solicitanteId}`);
      return;
    }

    // Relatório disponível em event.downloadUrl até event.expiresAt
    // A notificação de e-mail é responsabilidade do ms-notificacao;
    // aqui apenas confirmamos o recebimento e logamos para auditoria.
    this.logger.log(
      `Relatório ${event.relatorioId} disponível para ${funcionario.email} — url expira em ${event.expiresAt}`,
    );
  }
}
