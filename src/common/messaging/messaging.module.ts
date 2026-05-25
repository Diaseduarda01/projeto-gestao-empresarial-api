import { Global, Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { LembreteCronService } from './lembrete-cron.service';
import { PagamentoConfirmadoConsumer } from './consumers/pagamento-confirmado.consumer';
import { AgendamentoChatbotConsumer } from './consumers/agendamento-chatbot.consumer';
import { RelatorioProntoConsumer } from './consumers/relatorio-pronto.consumer';
import { ChatbotModule } from '../../modules/chatbot/chatbot.module';

@Global()
@Module({
  imports: [ChatbotModule],
  providers: [
    MessagingService,
    LembreteCronService,
    PagamentoConfirmadoConsumer,
    AgendamentoChatbotConsumer,
    RelatorioProntoConsumer,
  ],
  exports: [MessagingService],
})
export class MessagingModule {}
