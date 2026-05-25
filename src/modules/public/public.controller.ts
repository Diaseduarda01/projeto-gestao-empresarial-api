import {
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PublicService } from './public.service';

@Public()
@Controller('public')
export class PublicController {
  constructor(@Inject(PublicService) private readonly service: PublicService) {}

  @Get(':empresaSlug')
  empresa(@Param('empresaSlug') empresaSlug: string) {
    return this.service.getEmpresa(empresaSlug);
  }

  @Get(':empresaSlug/servicos')
  servicos(@Param('empresaSlug') empresaSlug: string) {
    return this.service.listarServicos(empresaSlug);
  }

  @Get(':empresaSlug/profissionais')
  profissionais(
    @Param('empresaSlug') empresaSlug: string,
    @Query('servicoId') servicoId?: string,
  ) {
    return this.service.listarProfissionais(empresaSlug, servicoId);
  }

  @Get(':empresaSlug/disponibilidade')
  disponibilidade(
    @Param('empresaSlug') empresaSlug: string,
    @Query('servicoId') servicoId: string,
    @Query('data') data: string,
    @Query('funcionarioId') funcionarioId?: string,
  ) {
    return this.service.disponibilidade(empresaSlug, servicoId, data, funcionarioId);
  }

  @Delete('agendamentos/:cancelToken')
  async cancelar(@Param('cancelToken') cancelToken: string) {
    const cancelled = await this.service.cancelarPorToken(cancelToken);
    if (!cancelled) throw new NotFoundException('Token de cancelamento inválido ou já utilizado');
    return { message: 'Agendamento cancelado com sucesso' };
  }
}
