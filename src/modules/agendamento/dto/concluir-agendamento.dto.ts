import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class ConcluirAgendamentoDto extends createZodDto(
  z.object({
    formaPagamento: z
      .enum(['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'CREDITO_LOJA', 'ABACATE_PAY'])
      .optional(),
    desconto: z.number().min(0).optional(),
    observacoes: z.string().max(500).optional(),
  }),
) {}
