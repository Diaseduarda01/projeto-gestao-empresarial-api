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
import { AgendamentoService } from './agendamento.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Agendamentos')
@ApiBearerAuth()
@Controller('agendamentos')
export class AgendamentoController {
  constructor(@Inject(AgendamentoService) private readonly agendamentoService: AgendamentoService) {}

  @Get()
  list(
    @CurrentUser() user: UserPayload,
    @Query('data') data: string | undefined,
    @Query() pagination: PaginationDto,
  ) {
    return this.agendamentoService.list(user.empresaId, pagination.page, pagination.limit, data);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.agendamentoService.get(id, user.empresaId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateAgendamentoDto) {
    return this.agendamentoService.create(dto, user.empresaId);
  }

  @Patch(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.agendamentoService.cancel(id, user.empresaId);
  }

  @Patch(':id/concluir')
  @HttpCode(HttpStatus.OK)
  conclude(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.agendamentoService.conclude(id, user.empresaId);
  }
}
