import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';

@Injectable()
export class SalaRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  findAll() {
    return this.prisma.sala.findMany({ orderBy: { nome: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.sala.findUnique({ where: { id } });
  }

  create(data: CreateSalaDto) {
    return this.prisma.sala.create({ data });
  }

  update(id: string, data: UpdateSalaDto) {
    return this.prisma.sala.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.sala.delete({ where: { id } });
  }

  findAgendamentoFuturo(salaId: string) {
    return this.prisma.agendamento.findFirst({
      where: { salaId, status: 'AGENDADO', horaInicio: { gte: new Date() } },
    });
  }
}
