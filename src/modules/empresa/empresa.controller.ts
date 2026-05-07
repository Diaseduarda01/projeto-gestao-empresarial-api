import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { ConvidarFuncionarioDto } from './dto/convidar-funcionario.dto';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Empresas')
@ApiBearerAuth()
@Controller('empresas')
export class EmpresaController {
  constructor(@Inject(EmpresaService) private readonly empresaService: EmpresaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateEmpresaDto) {
    return this.empresaService.create(dto, user.userId);
  }

  @Get('minha')
  getMinha(@CurrentUser() user: UserPayload) {
    return this.empresaService.get(user.empresaId);
  }

  @Get('minha/funcionarios')
  listFuncionarios(@CurrentUser() user: UserPayload) {
    return this.empresaService.listFuncionarios(user.empresaId);
  }

  @Post('minha/convidar-funcionario')
  @Roles(Role.ADMIN, Role.GERENTE)
  @HttpCode(HttpStatus.CREATED)
  convidar(@CurrentUser() user: UserPayload, @Body() dto: ConvidarFuncionarioDto) {
    return this.empresaService.convidarFuncionario(user.empresaId, dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.empresaService.get(id);
  }

  @Post(':id/convidar-funcionario')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  convidarById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvidarFuncionarioDto,
  ) {
    return this.empresaService.convidarFuncionario(id, dto);
  }
}
