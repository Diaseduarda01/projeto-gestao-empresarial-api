import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { FuncionarioService } from './funcionario.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { AddServicosDto } from './dto/add-servicos.dto';
import { UpsertHorarioTrabalhoDto } from './dto/horario-trabalho.dto';
import { CreateBloqueioAgendaDto } from './dto/bloqueio-agenda.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuditService } from '../../common/audit/audit.service';

@ApiTags('Funcionários')
@ApiBearerAuth()
@Controller('funcionarios')
export class FuncionarioController {
  constructor(
    @Inject(FuncionarioService) private readonly funcionarioService: FuncionarioService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Get()
  list(@CurrentUser() user: UserPayload, @Query() pagination: PaginationDto) {
    return this.funcionarioService.list(user.empresaId, pagination.page, pagination.limit);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.funcionarioService.get(id, user.empresaId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateFuncionarioDto) {
    return this.funcionarioService.create(dto, user.empresaId);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateFuncionarioDto,
  ) {
    return this.funcionarioService.update(id, user.empresaId, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    await this.funcionarioService.remove(id, user.empresaId);
    this.auditService.log({
      empresaId: user.empresaId,
      userId: user.userId,
      acao: 'DELETE',
      entidade: 'Funcionario',
      entidadeId: id,
    });
  }

  @Get(':id/servicos')
  listServicos(@Param('id', ParseUUIDPipe) id: string) {
    return this.funcionarioService.listServicos(id);
  }

  @Post(':id/servicos')
  @HttpCode(HttpStatus.CREATED)
  addServicos(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: AddServicosDto,
  ) {
    return this.funcionarioService.addServicos(id, user.empresaId, dto);
  }

  @Delete(':id/servicos/:servicoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeServico(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
    @Param('servicoId', ParseUUIDPipe) servicoId: string,
  ) {
    await this.funcionarioService.removeServico(id, user.empresaId, servicoId);
  }

  // Horários de trabalho

  @Get(':id/horarios-trabalho')
  listHorariosTrabalho(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.funcionarioService.listHorariosTrabalho(id, user.empresaId);
  }

  @Put(':id/horarios-trabalho/:diaSemana')
  upsertHorarioTrabalho(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('diaSemana', ParseIntPipe) diaSemana: number,
    @CurrentUser() user: UserPayload,
    @Body() dto: UpsertHorarioTrabalhoDto,
  ) {
    return this.funcionarioService.upsertHorarioTrabalho(id, user.empresaId, diaSemana, dto);
  }

  @Delete(':id/horarios-trabalho/:diaSemana')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeHorarioTrabalho(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('diaSemana', ParseIntPipe) diaSemana: number,
    @CurrentUser() user: UserPayload,
  ) {
    await this.funcionarioService.removeHorarioTrabalho(id, user.empresaId, diaSemana);
  }

  // Bloqueios de agenda

  @Get(':id/bloqueios')
  listBloqueios(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.funcionarioService.listBloqueios(id, user.empresaId);
  }

  @Post(':id/bloqueios')
  @HttpCode(HttpStatus.CREATED)
  createBloqueio(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateBloqueioAgendaDto,
  ) {
    return this.funcionarioService.createBloqueio(id, user.empresaId, dto);
  }

  @Delete(':id/bloqueios/:bloqueioId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBloqueio(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('bloqueioId', ParseUUIDPipe) bloqueioId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.funcionarioService.removeBloqueio(id, user.empresaId, bloqueioId);
  }

  // Disponibilidade

  @Get(':id/disponibilidade')
  disponibilidade(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
    @Query('data') data: string,
  ) {
    return this.funcionarioService.disponibilidade(id, user.empresaId, data);
  }
}
