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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { RegistrarEmpresaDto } from './dto/registrar-empresa.dto';
import { ConvidarFuncionarioDto } from './dto/convidar-funcionario.dto';
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
}
