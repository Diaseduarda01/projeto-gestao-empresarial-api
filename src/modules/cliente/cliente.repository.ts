import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ClienteRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  create(
    data: {
      nome: string;
      telefone: string;
      email: string;
      dataNascimento?: Date;
      cpf?: string;
      observacoes?: string;
      alergias?: string;
    },
    empresaId: string,
  ) {
    return this.prisma.cliente.create({ data: { ...data, empresaId } });
  }

  async findAll(empresaId: string, skip: number, take: number) {
    const where = { empresaId, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.cliente.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.cliente.count({ where }),
    ]);
    return { data, total };
  }

  findById(id: string, empresaId: string) {
    return this.prisma.cliente.findFirst({ where: { id, empresaId, deletedAt: null } });
  }

  update(
    id: string,
    data: Partial<{
      nome: string;
      telefone: string;
      email: string;
      dataNascimento: Date | null;
      cpf: string | null;
      observacoes: string | null;
      alergias: string | null;
    }>,
  ) {
    return this.prisma.cliente.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.cliente.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  findHistorico(id: string, empresaId: string) {
    return this.prisma.pedido.findMany({
      where: { clienteId: id, empresaId },
      include: {
        servicos: { include: { servico: { select: { id: true, nome: true, preco: true } } } },
        agendamento: {
          select: {
            id: true,
            data: true,
            horaInicio: true,
            horaFim: true,
            status: true,
            funcionario: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAniversariantes(empresaId: string, mes: number) {
    return this.prisma.$queryRaw<
      Array<{ id: string; nome: string; telefone: string; email: string; data_nascimento: Date }>
    >`
      SELECT id, nome, telefone, email, data_nascimento
      FROM clientes
      WHERE empresa_id = ${empresaId}
        AND deleted_at IS NULL
        AND data_nascimento IS NOT NULL
        AND EXTRACT(MONTH FROM data_nascimento) = ${mes}
      ORDER BY EXTRACT(DAY FROM data_nascimento)
    `;
  }
}
