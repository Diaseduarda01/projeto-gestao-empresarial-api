import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createClienteSchema = z.object({
  nome: z.string().min(1).max(120),
  telefone: z.string().min(8).max(20),
  email: z.string().email(),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD').optional(),
  cpf: z.string().max(14).optional(),
  observacoes: z.string().max(1000).optional(),
  alergias: z.string().max(500).optional(),
});

export class CreateClienteDto extends createZodDto(createClienteSchema) {}
