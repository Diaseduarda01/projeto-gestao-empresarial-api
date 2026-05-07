import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const convidarFuncionarioSchema = z.object({
  email: z.string().email(),
  nome: z.string().min(1).max(120).optional(),
  papel: z.enum(['ADMIN', 'GERENTE', 'ATENDENTE']).default('ATENDENTE'),
});

export class ConvidarFuncionarioDto extends createZodDto(convidarFuncionarioSchema) {}
