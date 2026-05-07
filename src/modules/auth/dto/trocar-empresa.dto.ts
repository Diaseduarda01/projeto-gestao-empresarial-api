import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const trocarEmpresaSchema = z.object({
  empresaId: z.string().uuid(),
});

export class TrocarEmpresaDto extends createZodDto(trocarEmpresaSchema) {}
