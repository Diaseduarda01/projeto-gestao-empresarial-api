import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const logoutSchema = z.object({
  refreshToken: z.string().uuid().optional(),
});

export class LogoutDto extends createZodDto(logoutSchema) {}
