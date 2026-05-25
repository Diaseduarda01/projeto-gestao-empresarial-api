import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const horaRegex = /^\d{2}:\d{2}$/;

export const upsertHorarioFuncionamentoSchema = z
  .object({
    horaAbertura: z.string().regex(horaRegex, 'Formato esperado: HH:mm'),
    horaFechamento: z.string().regex(horaRegex, 'Formato esperado: HH:mm'),
    ativo: z.boolean().optional().default(true),
  })
  .refine((d) => d.horaAbertura < d.horaFechamento, {
    message: 'horaAbertura deve ser anterior a horaFechamento',
    path: ['horaAbertura'],
  });

export class UpsertHorarioFuncionamentoDto extends createZodDto(upsertHorarioFuncionamentoSchema) {}
