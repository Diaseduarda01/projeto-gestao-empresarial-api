import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
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
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Funcionários')
@ApiBearerAuth()
@Controller('funcionarios')
export class FuncionarioController {
  constructor(@Inject(FuncionarioService) private readonly funcionarioService: FuncionarioService) {}

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
}
