import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodValidationException } from 'nestjs-zod';
import type { ZodIssue } from 'zod';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError() as { issues?: ZodIssue[] };
      return res.status(400).json({
        message: 'Dados inválidos',
        issues: zodError?.issues ?? [],
      });
    }

    if (exception instanceof HttpException) {
      return res.status(exception.getStatus()).json({ message: exception.message });
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const map: Record<string, [number, string]> = {
        P2025: [404, 'Registro não encontrado'],
        P2002: [409, 'Já existe um registro com este valor único'],
        P2003: [409, 'Operação viola um relacionamento existente'],
      };
      const [status, message] = map[exception.code] ?? [500, 'Erro interno do servidor'];
      return res.status(status).json({ message });
    }

    this.logger.error(exception);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
