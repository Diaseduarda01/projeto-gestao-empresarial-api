import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const horaRegex = /^\d{2}:\d{2}$/;

export const upsertHorarioTrabalhoSchema = z
  .object({
    horaInicio: z.string().regex(horaRegex, 'Formato esperado: HH:mm'),
    horaFim: z.string().regex(horaRegex, 'Formato esperado: HH:mm'),
  })
  .refine((d) => d.horaInicio < d.horaFim, {
    message: 'horaInicio deve ser anterior a horaFim',
    path: ['horaInicio'],
  });

export class UpsertHorarioTrabalhoDto extends createZodDto(upsertHorarioTrabalhoSchema) {}
