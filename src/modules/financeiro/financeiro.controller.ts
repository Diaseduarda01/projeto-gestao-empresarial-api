import { Controller, Get, Post, Patch, Param, Body, Query, Inject } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('financeiro')
export class FinanceiroController {
  constructor(@Inject(FinanceiroService) private service: FinanceiroService) {}

  @Post('pagamentos')
  create(@CurrentUser() user: any, @Body() dto: CreatePagamentoDto) {
    return this.service.create(user.empresaId, dto);
  }

  @Get('pagamentos')
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('data') data?: string,
  ) {
    return this.service.findAll(user.empresaId, status, data);
  }

  @Get('pagamentos/:id')
  findById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findById(id, user.empresaId);
  }

  @Patch('pagamentos/:id/confirmar')
  confirmar(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.confirmar(id, user.empresaId);
  }

  @Patch('pagamentos/:id/cancelar')
  cancelar(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.cancelar(id, user.empresaId);
  }

  @Get('caixa')
  caixaDia(
    @CurrentUser() user: any,
    @Query('data') data: string = new Date().toISOString().slice(0, 10),
  ) {
    return this.service.caixaDia(user.empresaId, data);
  }

  @Get('relatorio')
  relatorio(
    @CurrentUser() user: any,
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
  ) {
    return this.service.relatorio(user.empresaId, inicio, fim);
  }

  @Get('comissoes')
  comissoes(
    @CurrentUser() user: any,
    @Query('funcionarioId') funcionarioId: string,
    @Query('mes') mes: string,
  ) {
    return this.service.comissoes(user.empresaId, funcionarioId, mes);
  }
}
