import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const upsertComissaoSchema = z.object({
  funcionarioId: z.string().uuid(),
  servicoId: z.string().uuid().nullable().optional(),
  percentual: z.number().min(0).max(100),
});

export class UpsertComissaoDto extends createZodDto(upsertComissaoSchema) {}
