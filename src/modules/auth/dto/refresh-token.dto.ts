import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const refreshTokenSchema = z.object({
  refreshToken: z.string().uuid(),
});

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}
