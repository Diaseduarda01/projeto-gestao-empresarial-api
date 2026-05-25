import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createProdutoSchema = z.object({
  nome: z.string().min(1).max(120),
  descricao: z.string().max(500).optional(),
  unidade: z.string().min(1).max(20).default('un'),
  estoqueMinimoAlerta: z.number().min(0).default(0),
  preco: z.number().min(0).optional(),
});

export class CreateProdutoDto extends createZodDto(createProdutoSchema) {}
