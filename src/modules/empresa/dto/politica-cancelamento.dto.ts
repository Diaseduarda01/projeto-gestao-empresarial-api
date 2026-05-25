import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const upsertPoliticaCancelamentoSchema = z.object({
  prazoMinimoHoras: z.number().int().min(0),
  multaPercentual: z.number().min(0).max(100).optional(),
});

export class UpsertPoliticaCancelamentoDto extends createZodDto(upsertPoliticaCancelamentoSchema) {}
