import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createEmpresaSchema = z.object({
  nome: z.string().min(1).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'slug deve conter apenas letras minúsculas, números e hífens'),
  plano: z.enum(['BASIC', 'BRONZE', 'PLATINUM', 'GOLD']).optional(),
});

export class CreateEmpresaDto extends createZodDto(createEmpresaSchema) {}
