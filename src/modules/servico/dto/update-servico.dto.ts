import { createZodDto } from 'nestjs-zod';
import { createServicoSchema } from './create-servico.dto';

export class UpdateServicoDto extends createZodDto(createServicoSchema.partial()) {}
