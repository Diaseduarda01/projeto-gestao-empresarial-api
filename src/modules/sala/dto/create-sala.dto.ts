import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createSalaSchema = z.object({
  nome: z.string().min(1).max(100),
  descricao: z.string().default(''),
});

export class CreateSalaDto extends createZodDto(createSalaSchema) {}
