import { createZodDto } from 'nestjs-zod';
import { createSalaSchema } from './create-sala.dto';

export class UpdateSalaDto extends createZodDto(createSalaSchema.partial()) {}
