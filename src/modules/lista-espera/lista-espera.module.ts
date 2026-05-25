import { Module } from '@nestjs/common';
import { ListaEsperaController } from './lista-espera.controller';
import { ListaEsperaService } from './lista-espera.service';
import { ListaEsperaRepository } from './lista-espera.repository';

@Module({
  controllers: [ListaEsperaController],
  providers: [ListaEsperaService, ListaEsperaRepository],
})
export class ListaEsperaModule {}
