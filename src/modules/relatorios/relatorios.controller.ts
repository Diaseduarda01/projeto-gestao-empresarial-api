import { Controller, Get, Inject, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RelatoriosService } from './relatorios.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Relatórios')
@ApiBearerAuth()
@Controller('relatorios')
export class RelatoriosController {
  constructor(@Inject(RelatoriosService) private readonly service: RelatoriosService) {}

  @Get('agendamentos')
  @ApiQuery({ name: 'inicio', required: true, example: '2025-01-01' })
  @ApiQuery({ name: 'fim', required: true, example: '2025-01-31' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'funcionarioId', required: false })
  agendamentos(
    @CurrentUser() user: any,
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
    @Query('status') status?: string,
    @Query('funcionarioId') funcionarioId?: string,
  ) {
    return this.service.agendamentosPorPeriodo(user.empresaId, inicio, fim, status, funcionarioId);
  }

  @Get('cancelamentos')
  @ApiQuery({ name: 'inicio', required: true })
  @ApiQuery({ name: 'fim', required: true })
  cancelamentos(
    @CurrentUser() user: any,
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
  ) {
    return this.service.taxaCancelamento(user.empresaId, inicio, fim);
  }

  @Get('clientes')
  @ApiQuery({ name: 'inicio', required: true })
  @ApiQuery({ name: 'fim', required: true })
  clientes(
    @CurrentUser() user: any,
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
  ) {
    return this.service.clientesNovosVsRecorrentes(user.empresaId, inicio, fim);
  }

  @Get('agendamentos/csv')
  @ApiQuery({ name: 'inicio', required: true })
  @ApiQuery({ name: 'fim', required: true })
  async agendamentosCSV(
    @CurrentUser() user: any,
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
    @Res() res: Response,
  ) {
    const csv = await this.service.exportarAgendamentosCSV(user.empresaId, inicio, fim);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="agendamentos-${inicio}-${fim}.csv"`);
    res.send(csv);
  }
}
