import { Module } from '@nestjs/common';
import { ComissaoController } from './comissao.controller';
import { ComissaoService } from './comissao.service';
import { ComissaoRepository } from './comissao.repository';

@Module({
  controllers: [ComissaoController],
  providers: [ComissaoService, ComissaoRepository],
  exports: [ComissaoService],
})
export class ComissaoModule {}
