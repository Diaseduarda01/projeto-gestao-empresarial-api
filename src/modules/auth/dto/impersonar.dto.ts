import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class ImpersonarDto extends createZodDto(z.object({ empresaId: z.string().uuid() })) {}
