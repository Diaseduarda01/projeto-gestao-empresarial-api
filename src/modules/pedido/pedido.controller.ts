import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PedidoService } from './pedido.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { AddServicosPedidoDto } from './dto/add-servicos-pedido.dto';

@ApiTags('Pedidos')
@ApiBearerAuth()
@Controller('pedidos')
export class PedidoController {
  constructor(@Inject(PedidoService) private readonly pedidoService: PedidoService) {}

  @Get()
  list() {
    return this.pedidoService.list();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.pedidoService.get(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePedidoDto) {
    return this.pedidoService.create(dto);
  }

  @Post(':id/servicos')
  @HttpCode(HttpStatus.OK)
  addServicos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddServicosPedidoDto,
  ) {
    return this.pedidoService.addServicos(id, dto);
  }

  @Patch(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.pedidoService.cancel(id);
  }
}
