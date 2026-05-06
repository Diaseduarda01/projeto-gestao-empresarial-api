import { Module } from '@nestjs/common';
import { AgendamentoController } from './agendamento.controller';
import { AgendamentoService } from './agendamento.service';
import { AgendamentoRepository } from './agendamento.repository';

@Module({
  controllers: [AgendamentoController],
  providers: [AgendamentoService, AgendamentoRepository],
})
export class AgendamentoModule {}
