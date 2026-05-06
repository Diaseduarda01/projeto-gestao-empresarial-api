import { createZodDto } from 'nestjs-zod';
import { createClienteSchema } from './create-cliente.dto';

export class UpdateClienteDto extends createZodDto(createClienteSchema.partial()) {}
