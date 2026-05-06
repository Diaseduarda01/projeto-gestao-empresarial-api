import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const addServicosSchema = z.object({
  servicoIds: z.array(z.string().uuid()).min(1),
});

export class AddServicosDto extends createZodDto(addServicosSchema) {}
