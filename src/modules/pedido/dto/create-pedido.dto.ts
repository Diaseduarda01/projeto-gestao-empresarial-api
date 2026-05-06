import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createPedidoSchema = z.object({
  clienteId: z.string().uuid(),
  servicoIds: z.array(z.string().uuid()).min(1),
});

export class CreatePedidoDto extends createZodDto(createPedidoSchema) {}
