import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createClienteSchema = z.object({
  nome: z.string().min(1).max(120),
  telefone: z.string().min(8).max(20),
  email: z.string().email(),
});

export class CreateClienteDto extends createZodDto(createClienteSchema) {}
