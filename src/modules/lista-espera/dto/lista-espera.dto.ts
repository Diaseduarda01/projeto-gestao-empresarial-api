import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createListaEsperaSchema = z.object({
  clienteId: z.string().uuid(),
  servicoId: z.string().uuid(),
  funcionarioId: z.string().uuid().optional(),
  dataDesejada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
});

export class CreateListaEsperaDto extends createZodDto(createListaEsperaSchema) {}
