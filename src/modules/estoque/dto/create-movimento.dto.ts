import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createMovimentoSchema = z.object({
  produtoId: z.string().uuid(),
  tipo: z.enum(['ENTRADA', 'SAIDA', 'AJUSTE']),
  quantidade: z.number().positive(),
  referencia: z.string().max(200).optional(),
  agendamentoId: z.string().uuid().optional(),
});

export class CreateMovimentoDto extends createZodDto(createMovimentoSchema) {}
