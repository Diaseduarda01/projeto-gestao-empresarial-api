import { Controller, Get, Post, Delete, Param, Body, Query, Inject } from '@nestjs/common';
import { ComissaoService } from './comissao.service';
import { UpsertComissaoDto } from './dto/upsert-comissao.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('comissoes')
export class ComissaoController {
  constructor(@Inject(ComissaoService) private service: ComissaoService) {}

  @Post()
  upsert(@CurrentUser() user: any, @Body() dto: UpsertComissaoDto) {
    return this.service.upsert(user.empresaId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query('funcionarioId') funcionarioId?: string) {
    return this.service.findAll(user.empresaId, funcionarioId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(id, user.empresaId);
  }

  @Get('relatorio')
  relatorio(
    @CurrentUser() user: any,
    @Query('funcionarioId') funcionarioId: string,
    @Query('mes') mes: string = new Date().toISOString().slice(0, 7),
  ) {
    return this.service.relatorio(user.empresaId, funcionarioId, mes);
  }
}
