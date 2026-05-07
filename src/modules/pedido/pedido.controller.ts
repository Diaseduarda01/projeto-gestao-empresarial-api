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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PedidoService } from './pedido.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { AddServicosPedidoDto } from './dto/add-servicos-pedido.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuditService } from '../../common/audit/audit.service';

@ApiTags('Pedidos')
@ApiBearerAuth()
@Controller('pedidos')
export class PedidoController {
  constructor(
    @Inject(PedidoService) private readonly pedidoService: PedidoService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Get()
  list(@CurrentUser() user: UserPayload, @Query() pagination: PaginationDto) {
    return this.pedidoService.list(user.empresaId, pagination.page, pagination.limit);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.pedidoService.get(id, user.empresaId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: UserPayload, @Body() dto: CreatePedidoDto) {
    return this.pedidoService.create(dto, user.empresaId);
  }

  @Post(':id/servicos')
  @HttpCode(HttpStatus.OK)
  addServicos(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: AddServicosPedidoDto,
  ) {
    return this.pedidoService.addServicos(id, user.empresaId, dto);
  }

  @Patch(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    const result = await this.pedidoService.cancel(id, user.empresaId);
    this.auditService.log({
      empresaId: user.empresaId,
      userId: user.userId,
      acao: 'CANCELAR',
      entidade: 'Pedido',
      entidadeId: id,
    });
    return result;
  }
}
