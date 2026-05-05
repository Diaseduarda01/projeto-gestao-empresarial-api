import { prisma } from "../../database/prisma";

export async function cleanDb() {
  await prisma.agendamento.deleteMany();
  await prisma.pedidoServico.deleteMany();
  await prisma.funcionarioServico.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.funcionario.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.sala.deleteMany();
}
