import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';

@Injectable()
export class SalaRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findAll(empresaId: string) {
    return this.prisma.sala.findMany({
      where: { empresaId, deletedAt: null },
      orderBy: { nome: 'asc' },
    });
  }

  findById(id: string, empresaId: string) {
    return this.prisma.sala.findFirst({ where: { id, empresaId, deletedAt: null } });
  }

  create(data: CreateSalaDto, empresaId: string) {
    return this.prisma.sala.create({ data: { ...data, empresaId } });
  }

  update(id: string, data: UpdateSalaDto) {
    return this.prisma.sala.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.sala.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  findAgendamentoFuturo(salaId: string, empresaId: string) {
    return this.prisma.agendamento.findFirst({
      where: { salaId, empresaId, status: 'AGENDADO', horaInicio: { gte: new Date() } },
    });
  }
}
