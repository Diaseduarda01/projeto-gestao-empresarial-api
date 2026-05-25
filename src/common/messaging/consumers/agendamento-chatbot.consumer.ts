import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { MessagingService } from '../messaging.service';
import { ChatbotService } from '../../../modules/chatbot/chatbot.service';
import { ERP_CONSUME_QUEUE, ChatbotAgendamentoEvent } from '../erp-events';

@Injectable()
export class AgendamentoChatbotConsumer implements OnModuleInit {
  private readonly logger = new Logger(AgendamentoChatbotConsumer.name);

  constructor(
    @Inject(MessagingService) private readonly messaging: MessagingService,
    @Inject(ChatbotService) private readonly chatbotService: ChatbotService,
  ) {}

  async onModuleInit() {
    await this.messaging.consume(ERP_CONSUME_QUEUE.AGENDAMENTO_CHATBOT, (payload) =>
      this.handle(payload as ChatbotAgendamentoEvent),
    );
  }

  private async handle(event: ChatbotAgendamentoEvent) {
    this.logger.log(
      `Agendamento via chatbot — sessionId=${event.sessionId} empresa=${event.empresaId}`,
    );

    const cliente = await this.chatbotService.buscarOuCriarCliente({
      empresaId: event.empresaId,
      nome: event.clienteNome,
      telefone: event.clienteTelefone,
    });

    // horaInicio chega como ISO completo (ex: "2025-12-25T10:00:00.000Z")
    const iso = new Date(event.horaInicio);
    const data = iso.toISOString().substring(0, 10);        // "2025-12-25"
    const horaInicio = iso.toISOString().substring(11, 16); // "10:00"

    await this.chatbotService.criarAgendamento({
      empresaId: event.empresaId,
      clienteId: cliente.id,
      servicoId: event.servicoId,
      data,
      horaInicio,
    });

    this.logger.log(
      `Agendamento via chatbot criado — cliente=${cliente.id} servico=${event.servicoId}`,
    );
  }
}
