/**
 * Contratos de mensageria do ms-erp-api.
 * Alinhado com ms-rabbitmq/src/messaging/topology.ts e events.ts.
 */

export const ERP_EXCHANGE = 'erp.events';

/** Filas que o ms-erp-api PUBLICA */
export const ERP_ROUTING_KEY = {
  AGENDAMENTO_CRIADO: 'agendamento.criado',
  AGENDAMENTO_CANCELADO: 'agendamento.cancelado',
  AGENDAMENTO_LEMBRETE: 'agendamento.lembrete',
  AGENDAMENTO_CONCLUIDO: 'agendamento.concluido',
  RELATORIO_SOLICITADO: 'relatorio.solicitado',
} as const;

/** Filas que o ms-erp-api CONSOME */
export const ERP_CONSUME_QUEUE = {
  PAGAMENTO_CONFIRMADO: 'erp.pagamento_confirmado',
  AGENDAMENTO_CHATBOT: 'erp.agendamento_chatbot',
  RELATORIO_PRONTO: 'notificacao.relatorio_pronto',
} as const;

// ─── Payloads de publicação ────────────────────────────────────────────────────

export interface AgendamentoCriadoEvent {
  agendamentoId: string;
  empresaId: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  funcionarioNome: string;
  servicoNome: string;
  horaInicio: string; // ISO 8601
  horaFim: string;    // ISO 8601
}

export interface AgendamentoCanceladoEvent {
  agendamentoId: string;
  empresaId: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
}

export interface AgendamentoLembrete24hEvent {
  agendamentoId: string;
  empresaId: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  funcionarioNome: string;
  servicoNome: string;
  horaInicio: string; // ISO 8601
}

export interface AgendamentoConcluidoEvent {
  agendamentoId: string;
  empresaId: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  valorTotal: number;
  servicoNome: string;
}

// ─── Payloads de consumo ───────────────────────────────────────────────────────

export interface PagamentoConfirmadoEvent {
  agendamentoId: string;
  empresaId: string;
  cobrancaId: string;
  valorPago: number;
  formaPagamento: string;
  pagoEm: string; // ISO 8601
}

export interface ChatbotAgendamentoEvent {
  sessionId: string;
  empresaId: string;
  clienteNome: string;
  clienteTelefone: string;
  servicoId: string;
  funcionarioId: string;
  horaInicio: string; // ISO 8601 — ex: "2025-12-25T10:00:00.000Z"
}

export interface RelatorioProntoEvent {
  relatorioId: string;
  empresaId: string;
  solicitanteId: string;
  downloadUrl: string;
  expiresAt: string; // ISO 8601
}

export interface RelatorioSolicitadoEvent {
  relatorioId: string;
  empresaId: string;
  solicitanteId: string;
  tipo: string; // 'financeiro' | 'agendamentos' | 'clientes' | 'comissoes'
  parametros: Record<string, string>;
}
