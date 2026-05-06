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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FuncionarioService } from './funcionario.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { AddServicosDto } from './dto/add-servicos.dto';

@ApiTags('Funcionários')
@ApiBearerAuth()
@Controller('funcionarios')
export class FuncionarioController {
  constructor(@Inject(FuncionarioService) private readonly funcionarioService: FuncionarioService) {}

  @Get()
  list() {
    return this.funcionarioService.list();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.funcionarioService.get(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateFuncionarioDto) {
    return this.funcionarioService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFuncionarioDto) {
    return this.funcionarioService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.funcionarioService.remove(id);
  }

  @Get(':id/servicos')
  listServicos(@Param('id', ParseUUIDPipe) id: string) {
    return this.funcionarioService.listServicos(id);
  }

  @Post(':id/servicos')
  @HttpCode(HttpStatus.CREATED)
  addServicos(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddServicosDto) {
    return this.funcionarioService.addServicos(id, dto);
  }

  @Delete(':id/servicos/:servicoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeServico(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('servicoId', ParseUUIDPipe) servicoId: string,
  ) {
    await this.funcionarioService.removeServico(id, servicoId);
  }
}
