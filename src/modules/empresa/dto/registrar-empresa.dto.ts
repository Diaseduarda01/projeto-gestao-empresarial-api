import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const registrarEmpresaSchema = z.object({
  nome:       z.string().min(1).max(120),
  slug:       z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, 'slug deve conter apenas letras minúsculas, números e hífens'),
  adminNome:  z.string().min(1).max(120),
  adminEmail: z.string().email(),
  adminSenha: z.string().min(6),
});

export class RegistrarEmpresaDto extends createZodDto(registrarEmpresaSchema) {}
