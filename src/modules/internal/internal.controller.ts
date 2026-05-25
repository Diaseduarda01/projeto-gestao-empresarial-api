import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Public } from '../../common/decorators/public.decorator';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard';
import { PrismaService } from '../../database/prisma.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { MessagingService } from '../../common/messaging/messaging.service';
import { ERP_ROUTING_KEY, RelatorioSolicitadoEvent } from '../../common/messaging/erp-events';
import {
  InternalAgendamentoDto,
  InternalClienteDto,
  InternalRelatorioDto,
} from './dto/internal.dto';

@Public()
@UseGuards(InternalApiKeyGuard)
@Controller('internal')
export class InternalController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ChatbotService) private readonly chatbotService: ChatbotService,
    @Inject(MessagingService) private readonly messaging: MessagingService,
  ) {}

  @Get('empresas/slug/:slug')
  async getEmpresaBySlug(@Param('slug') slug: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { slug },
      select: { id: true, slug: true, nome: true, plano: true },
    });

    if (!empresa) throw new NotFoundException('Empresa não encontrada');

    return empresa;
  }

  @Get('disponibilidade')
  async disponibilidade(
    @Query('empresaId') empresaId: string,
    @Query('servicoId') servicoId: string,
    @Query('data') data: string,
    @Query('dataHoraInicio') dataHoraInicio?: string,
    @Query('dataHoraFim') dataHoraFim?: string,
  ) {
    if (dataHoraInicio && dataHoraFim) {
      const dataStr = dataHoraInicio.split('T')[0];
      const horaInicio = dataHoraInicio.substring(11, 16);
      const slots = await this.chatbotService.disponibilidade(empresaId, servicoId, dataStr);
      const disponivel = slots.includes(horaInicio);
      return { disponivel };
    }
    return this.chatbotService.disponibilidade(empresaId, servicoId, data);
  }

  @Post('agendamentos')
  criarAgendamento(@Body() dto: InternalAgendamentoDto) {
    return this.chatbotService.criarAgendamento({
      empresaId: dto.empresaId,
      clienteId: dto.clienteId,
      servicoId: dto.servicoId,
      data: dto.data,
      horaInicio: dto.horaInicio,
    });
  }

  @Get('servicos')
  listarServicos(@Query('empresaId') empresaId: string) {
    return this.chatbotService.listarServicos(empresaId);
  }

  @Post('clientes/buscar-ou-criar')
  buscarOuCriarCliente(@Body() dto: InternalClienteDto) {
    return this.chatbotService.buscarOuCriarCliente(dto);
  }

  @Post('relatorios/solicitar')
  async solicitarRelatorio(@Body() dto: InternalRelatorioDto) {
    const relatorioId = randomUUID();
    const event: RelatorioSolicitadoEvent = {
      relatorioId,
      empresaId: dto.empresaId,
      solicitanteId: dto.solicitanteId,
      tipo: dto.tipo,
      parametros: dto.parametros,
    };
    await this.messaging.publish(ERP_ROUTING_KEY.RELATORIO_SOLICITADO, event);
    return { relatorioId, status: 'enfileirado' };
  }
}
