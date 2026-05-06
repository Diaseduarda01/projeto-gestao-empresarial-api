import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const addServicosPedidoSchema = z.object({
  servicoIds: z.array(z.string().uuid()).min(1),
});

export class AddServicosPedidoDto extends createZodDto(addServicosPedidoSchema) {}
