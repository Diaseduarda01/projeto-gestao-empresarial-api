import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard';
import { ChatbotService } from './chatbot.service';
import { ChatbotAgendamentoDto, ChatbotClienteDto } from './dto/chatbot.dto';

@ApiTags('Chatbot (Internal)')
@Public()
@UseGuards(InternalApiKeyGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(@Inject(ChatbotService) private readonly service: ChatbotService) {}

  @Get('servicos')
  listarServicos(@Query('empresaId') empresaId: string) {
    return this.service.listarServicos(empresaId);
  }

  @Post('clientes')
  @HttpCode(HttpStatus.OK)
  buscarOuCriarCliente(@Body() dto: ChatbotClienteDto) {
    return this.service.buscarOuCriarCliente(dto);
  }

  @Get('disponibilidade')
  disponibilidade(
    @Query('empresaId') empresaId: string,
    @Query('servicoId') servicoId: string,
    @Query('data') data: string,
  ) {
    return this.service.disponibilidade(empresaId, servicoId, data);
  }

  @Post('agendamentos')
  @HttpCode(HttpStatus.CREATED)
  criarAgendamento(@Body() dto: ChatbotAgendamentoDto) {
    return this.service.criarAgendamento({
      empresaId: dto.empresaId,
      clienteId: dto.clienteId,
      servicoId: dto.servicoId,
      data: dto.data,
      horaInicio: dto.horaInicio,
    });
  }

  @Get('agendamentos')
  listarAgendamentos(
    @Query('empresaId') empresaId: string,
    @Query('clienteId') clienteId: string,
  ) {
    return this.service.listarAgendamentos(empresaId, clienteId);
  }

  @Patch('agendamentos/:id/cancelar')
  @HttpCode(HttpStatus.OK)
  cancelarAgendamento(@Param('id') id: string) {
    return this.service.cancelarAgendamento(id);
  }
}
