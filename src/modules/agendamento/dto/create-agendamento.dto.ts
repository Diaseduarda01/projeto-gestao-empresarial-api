import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createAgendamentoSchema = z.object({
  pedidoId: z.string().uuid(),
  funcionarioId: z.string().uuid(),
  salaId: z.string().uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato esperado: HH:mm'),
});

export class CreateAgendamentoDto extends createZodDto(createAgendamentoSchema) {}
