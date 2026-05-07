import { Injectable, Inject, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface AuditLogParams {
  empresaId: string;
  userId: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  detalhes?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  log(params: AuditLogParams): void {
    this.prisma.auditLog
      .create({
        data: {
          empresaId: params.empresaId,
          userId: params.userId,
          acao: params.acao,
          entidade: params.entidade,
          entidadeId: params.entidadeId,
          detalhes: params.detalhes as Prisma.InputJsonValue | undefined,
        },
      })
      .catch((err) => {
        this.logger.error({ err, params }, 'Falha ao registrar audit log');
      });
  }
}
