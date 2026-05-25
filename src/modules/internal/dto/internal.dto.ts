import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class InternalAgendamentoDto extends createZodDto(
  z.object({
    empresaId: z.string().uuid(),
    clienteId: z.string().uuid(),
    servicoId: z.string().uuid(),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
    horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato esperado: HH:mm'),
  }),
) {}

export class InternalClienteDto extends createZodDto(
  z.object({
    empresaId: z.string().uuid(),
    nome: z.string().min(2),
    telefone: z.string().min(10).max(20).optional(),
    email: z.string().email().optional(),
  }),
) {}

export class InternalRelatorioDto extends createZodDto(
  z.object({
    empresaId: z.string().uuid(),
    solicitanteId: z.string().uuid(),
    tipo: z.enum(['financeiro', 'agendamentos', 'clientes', 'comissoes']),
    parametros: z.record(z.string()).default({}),
  }),
) {}
