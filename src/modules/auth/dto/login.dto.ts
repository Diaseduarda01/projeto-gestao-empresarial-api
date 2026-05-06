import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export class LoginDto extends createZodDto(loginSchema) {}
