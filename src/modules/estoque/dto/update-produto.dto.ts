import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const updateProdutoSchema = z.object({
  nome: z.string().min(1).max(120).optional(),
  descricao: z.string().max(500).optional(),
  unidade: z.string().min(1).max(20).optional(),
  estoqueMinimoAlerta: z.number().min(0).optional(),
  preco: z.number().min(0).optional(),
  ativo: z.boolean().optional(),
});

export class UpdateProdutoDto extends createZodDto(updateProdutoSchema) {}
