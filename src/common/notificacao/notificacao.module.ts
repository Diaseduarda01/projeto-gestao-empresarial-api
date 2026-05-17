import { Global, Module } from '@nestjs/common';
import { NotificacaoService } from './notificacao.service';

@Global()
@Module({
  providers: [NotificacaoService],
  exports: [NotificacaoService],
})
export class NotificacaoModule {}
