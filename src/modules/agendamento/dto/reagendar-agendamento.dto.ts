import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const reagendarAgendamentoSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato esperado: HH:mm'),
  salaId: z.string().uuid().optional(),
  motivoReagendamento: z.string().max(500).optional(),
});

export class ReagendarAgendamentoDto extends createZodDto(reagendarAgendamentoSchema) {}
