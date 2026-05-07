import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const recuperarSenhaSchema = z.object({
  email: z.string().email(),
});

export class RecuperarSenhaDto extends createZodDto(recuperarSenhaSchema) {}
