import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createFuncionarioSchema = z.object({
  nome: z.string().min(1).max(120),
  email: z.string().email(),
  senha: z.string().min(6).max(100),
});

export class CreateFuncionarioDto extends createZodDto(createFuncionarioSchema) {}
