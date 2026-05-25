import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createPagamentoSchema = z.object({
  agendamentoId: z.string().uuid().optional(),
  clienteId: z.string().uuid(),
  valor: z.number().positive(),
  desconto: z.number().min(0).optional(),
  formaPagamento: z.enum(['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'CREDITO_LOJA', 'ABACATE_PAY']),
  observacoes: z.string().max(500).optional(),
});

export class CreatePagamentoDto extends createZodDto(createPagamentoSchema) {}
