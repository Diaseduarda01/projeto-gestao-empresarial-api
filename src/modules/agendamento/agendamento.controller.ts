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

@ApiTags('Agendamentos')
@ApiBearerAuth()
@Controller('agendamentos')
export class AgendamentoController {
  constructor(
    @Inject(AgendamentoService) private readonly agendamentoService: AgendamentoService,
  ) {}

  @Get()
  list(@Query('data') data?: string) {
    return this.agendamentoService.list(data);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.agendamentoService.get(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAgendamentoDto) {
    return this.agendamentoService.create(dto);
  }

  @Patch(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.agendamentoService.cancel(id);
  }

  @Patch(':id/concluir')
  @HttpCode(HttpStatus.OK)
  conclude(@Param('id', ParseUUIDPipe) id: string) {
    return this.agendamentoService.conclude(id);
  }
}
