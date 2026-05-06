import { Module } from '@nestjs/common';
import { ServicoController } from './servico.controller';
import { ServicoService } from './servico.service';
import { ServicoRepository } from './servico.repository';

@Module({
  controllers: [ServicoController],
  providers: [ServicoService, ServicoRepository],
})
export class ServicoModule {}
