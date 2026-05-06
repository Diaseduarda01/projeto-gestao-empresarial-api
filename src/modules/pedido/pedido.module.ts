import { Module } from '@nestjs/common';
import { PedidoController } from './pedido.controller';
import { PedidoService } from './pedido.service';
import { PedidoRepository } from './pedido.repository';

@Module({
  controllers: [PedidoController],
  providers: [PedidoService, PedidoRepository],
})
export class PedidoModule {}
