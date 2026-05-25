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
import { ReagendarAgendamentoDto } from './dto/reagendar-agendamento.dto';
import { ConcluirAgendamentoDto } from './dto/concluir-agendamento.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuditService } from '../../common/audit/audit.service';

@ApiTags('Agendamentos')
@ApiBearerAuth()
@Controller('agendamentos')
export class AgendamentoController {
  constructor(
    @Inject(AgendamentoService) private readonly agendamentoService: AgendamentoService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

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
  async create(@CurrentUser() user: UserPayload, @Body() dto: CreateAgendamentoDto) {
    const result = await this.agendamentoService.create(dto, user.empresaId);
    this.auditService.log({
      empresaId: user.empresaId,
      userId: user.userId,
      acao: 'CRIAR',
      entidade: 'Agendamento',
      entidadeId: result.id,
    });
    return result;
  }

  @Patch(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    const result = await this.agendamentoService.cancel(id, user.empresaId);
    this.auditService.log({
      empresaId: user.empresaId,
      userId: user.userId,
      acao: 'CANCELAR',
      entidade: 'Agendamento',
      entidadeId: id,
    });
    return result;
  }

  @Patch(':id/concluir')
  @HttpCode(HttpStatus.OK)
  async conclude(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: ConcluirAgendamentoDto,
  ) {
    const result = await this.agendamentoService.conclude(id, user.empresaId, dto);
    this.auditService.log({
      empresaId: user.empresaId,
      userId: user.userId,
      acao: 'CONCLUIR',
      entidade: 'Agendamento',
      entidadeId: id,
    });
    return result;
  }

  @Patch(':id/reagendar')
  @HttpCode(HttpStatus.OK)
  async reagendar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: ReagendarAgendamentoDto,
  ) {
    const result = await this.agendamentoService.reagendar(id, user.empresaId, dto, user.userId);
    this.auditService.log({
      empresaId: user.empresaId,
      userId: user.userId,
      acao: 'REAGENDAR',
      entidade: 'Agendamento',
      entidadeId: id,
      detalhes: { data: dto.data, horaInicio: dto.horaInicio },
    });
    return result;
  }
}
