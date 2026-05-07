import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const redefinirSenhaSchema = z.object({
  token: z.string().min(1),
  novaSenha: z.string().min(6),
});

export class RedefinirSenhaDto extends createZodDto(redefinirSenhaSchema) {}
