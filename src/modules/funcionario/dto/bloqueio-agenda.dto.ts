import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const horaRegex = /^\d{2}:\d{2}$/;

export const createBloqueioAgendaSchema = z
  .object({
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
    horaInicio: z.string().regex(horaRegex, 'Formato esperado: HH:mm').optional(),
    horaFim: z.string().regex(horaRegex, 'Formato esperado: HH:mm').optional(),
    motivo: z.string().max(500).optional(),
  })
  .refine(
    (d) => {
      if (d.horaInicio && d.horaFim) return d.horaInicio < d.horaFim;
      if (d.horaInicio && !d.horaFim) return false;
      if (!d.horaInicio && d.horaFim) return false;
      return true;
    },
    { message: 'Forneça horaInicio e horaFim juntos, ou nenhum (bloqueio do dia inteiro)', path: ['horaInicio'] },
  );

export class CreateBloqueioAgendaDto extends createZodDto(createBloqueioAgendaSchema) {}
