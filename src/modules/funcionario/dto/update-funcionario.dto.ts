import { createZodDto } from 'nestjs-zod';
import { createFuncionarioSchema } from './create-funcionario.dto';

export class UpdateFuncionarioDto extends createZodDto(createFuncionarioSchema.partial()) {}
