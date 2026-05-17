import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class AceitarConviteDto extends createZodDto(
  z.object({
    token: z.string().min(1),
    nome:  z.string().min(1).max(120).optional(),
    senha: z.string().min(6),
  }),
) {}
