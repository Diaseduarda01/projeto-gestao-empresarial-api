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
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { RegistrarEmpresaDto } from './dto/registrar-empresa.dto';
import { ConvidarFuncionarioDto } from './dto/convidar-funcionario.dto';
import { UpsertHorarioFuncionamentoDto } from './dto/horario-funcionamento.dto';
import { UpsertPoliticaCancelamentoDto } from './dto/politica-cancelamento.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Empresas')
@Controller('empresas')
export class EmpresaController {
  constructor(@Inject(EmpresaService) private readonly empresaService: EmpresaService) {}

  @Public()
  @Get('check-slug')
  checkSlug(@Query('slug') slug: string) {
    return this.empresaService.checkSlug(slug ?? '');
  }

  @Public()
  @Post('registrar')
  @HttpCode(HttpStatus.CREATED)
  registrar(@Body() dto: RegistrarEmpresaDto) {
    return this.empresaService.registrar(dto);
  }

  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateEmpresaDto) {
    return this.empresaService.create(dto, user.userId);
  }

  @ApiBearerAuth()
  @Get('minha')
  getMinha(@CurrentUser() user: UserPayload) {
    return this.empresaService.get(user.empresaId);
  }

  @ApiBearerAuth()
  @Get('minha/funcionarios')
  listFuncionarios(@CurrentUser() user: UserPayload) {
    return this.empresaService.listFuncionarios(user.empresaId);
  }

  @ApiBearerAuth()
  @Post('minha/convidar-funcionario')
  @Roles(Role.ADMIN, Role.GERENTE)
  @HttpCode(HttpStatus.CREATED)
  convidar(@CurrentUser() user: UserPayload, @Body() dto: ConvidarFuncionarioDto) {
    return this.empresaService.convidarFuncionario(user.empresaId, dto);
  }

  @ApiBearerAuth()
  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.empresaService.get(id);
  }

  @ApiBearerAuth()
  @Post(':id/convidar-funcionario')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  convidarById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvidarFuncionarioDto,
  ) {
    return this.empresaService.convidarFuncionario(id, dto);
  }

  // Horário de Funcionamento

  @ApiBearerAuth()
  @Get('minha/horario-funcionamento')
  listHorarioFuncionamento(@CurrentUser() user: UserPayload) {
    return this.empresaService.listHorarioFuncionamento(user.empresaId);
  }

  @ApiBearerAuth()
  @Put('minha/horario-funcionamento/:diaSemana')
  upsertHorarioFuncionamento(
    @Param('diaSemana', ParseIntPipe) diaSemana: number,
    @CurrentUser() user: UserPayload,
    @Body() dto: UpsertHorarioFuncionamentoDto,
  ) {
    return this.empresaService.upsertHorarioFuncionamento(user.empresaId, diaSemana, dto);
  }

  @ApiBearerAuth()
  @Delete('minha/horario-funcionamento/:diaSemana')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeHorarioFuncionamento(
    @Param('diaSemana', ParseIntPipe) diaSemana: number,
    @CurrentUser() user: UserPayload,
  ) {
    await this.empresaService.removeHorarioFuncionamento(user.empresaId, diaSemana);
  }

  // Política de Cancelamento

  @ApiBearerAuth()
  @Get('minha/politica-cancelamento')
  getPoliticaCancelamento(@CurrentUser() user: UserPayload) {
    return this.empresaService.getPoliticaCancelamento(user.empresaId);
  }

  @ApiBearerAuth()
  @Put('minha/politica-cancelamento')
  upsertPoliticaCancelamento(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpsertPoliticaCancelamentoDto,
  ) {
    return this.empresaService.upsertPoliticaCancelamento(user.empresaId, dto);
  }

  @ApiBearerAuth()
  @Delete('minha/politica-cancelamento')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePoliticaCancelamento(@CurrentUser() user: UserPayload) {
    await this.empresaService.removePoliticaCancelamento(user.empresaId);
  }
}
