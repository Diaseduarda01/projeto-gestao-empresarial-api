import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createServicoSchema = z.object({
  nome: z.string().min(1).max(100),
  descricao: z.string().default(''),
  duracao: z.number().int().positive(),
  preco: z.number().nonnegative(),
});

export class CreateServicoDto extends createZodDto(createServicoSchema) {}
