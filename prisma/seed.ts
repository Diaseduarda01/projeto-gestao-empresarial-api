import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash("admin123", 10);
  const senhaFunc = await bcrypt.hash("func123", 10);

  // Empresa
  const empresa = await prisma.empresa.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: { nome: "Musa Spa & Estética", slug: "musa-spa" },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      nome: "Musa Spa & Estética",
      slug: "musa-spa",
      plano: "PROFISSIONAL",
    },
  });

  // Admin
  const admin = await prisma.funcionario.upsert({
    where: { email: "admin@admin.com" },
    update: {},
    create: { nome: "Administrador", email: "admin@admin.com", senha },
  });

  await prisma.funcionarioEmpresa.upsert({
    where: { funcionarioId_empresaId: { funcionarioId: admin.id, empresaId: empresa.id } },
    update: { papel: "ADMIN" },
    create: { funcionarioId: admin.id, empresaId: empresa.id, papel: "ADMIN" },
  });

  // Funcionários
  const funcionariosData = [
    { nome: "Ana Paula Silva", email: "ana@musaspa.com" },
    { nome: "Carla Mendes", email: "carla@musaspa.com" },
    { nome: "Juliana Rocha", email: "juliana@musaspa.com" },
  ];

  const funcionarios: { id: string; nome: string }[] = [];
  for (const f of funcionariosData) {
    const func = await prisma.funcionario.upsert({
      where: { email: f.email },
      update: {},
      create: { nome: f.nome, email: f.email, senha: senhaFunc },
    });
    await prisma.funcionarioEmpresa.upsert({
      where: { funcionarioId_empresaId: { funcionarioId: func.id, empresaId: empresa.id } },
      update: { papel: "ATENDENTE" },
      create: { funcionarioId: func.id, empresaId: empresa.id, papel: "ATENDENTE" },
    });
    funcionarios.push(func);
  }

  // Salas
  const salasData = [
    { nome: "Sala 1 — Massagem", descricao: "Sala equipada para massagens e relaxamento" },
    { nome: "Sala 2 — Estética", descricao: "Sala para procedimentos estéticos faciais" },
    { nome: "Sala 3 — Manicure", descricao: "Sala para unhas e pedicure" },
  ];

  const salas: { id: string }[] = [];
  for (const s of salasData) {
    const existing = await prisma.sala.findFirst({ where: { nome: s.nome, empresaId: empresa.id } });
    if (existing) {
      salas.push(existing);
    } else {
      const sala = await prisma.sala.create({ data: { ...s, empresaId: empresa.id } });
      salas.push(sala);
    }
  }

  // Serviços
  const servicosData = [
    { nome: "Massagem Relaxante", descricao: "Massagem corporal completa 60min", duracao: 60, preco: 150 },
    { nome: "Limpeza de Pele", descricao: "Limpeza de pele profunda com extração", duracao: 90, preco: 120 },
    { nome: "Manicure", descricao: "Manicure completa com esmaltação", duracao: 45, preco: 50 },
    { nome: "Pedicure", descricao: "Pedicure completa com esmaltação", duracao: 60, preco: 60 },
    { nome: "Design de Sobrancelha", descricao: "Design e henna de sobrancelha", duracao: 30, preco: 40 },
    { nome: "Depilação Axilas", descricao: "Depilação com cera quente nas axilas", duracao: 20, preco: 35 },
  ];

  const servicos: { id: string; duracao: number }[] = [];
  for (const s of servicosData) {
    const existing = await prisma.servico.findFirst({ where: { nome: s.nome, empresaId: empresa.id } });
    if (existing) {
      servicos.push(existing);
    } else {
      const servico = await prisma.servico.create({ data: { ...s, empresaId: empresa.id } });
      servicos.push(servico);
    }
  }

  // Especialidades dos funcionários
  const especialidades: Record<number, number[]> = {
    0: [0, 1],    // Ana: Massagem + Limpeza de Pele
    1: [2, 3, 5], // Carla: Manicure + Pedicure + Depilação
    2: [4, 1],    // Juliana: Design Sobrancelha + Limpeza de Pele
  };

  for (const [fi, servicoIdxs] of Object.entries(especialidades)) {
    const func = funcionarios[Number(fi)];
    for (const si of servicoIdxs) {
      const servico = servicos[si];
      await prisma.funcionarioServico.upsert({
        where: { funcionarioId_servicoId: { funcionarioId: func.id, servicoId: servico.id } },
        update: {},
        create: { funcionarioId: func.id, servicoId: servico.id },
      });
    }
  }

  // Clientes
  const clientesData = [
    { nome: "Maria Fernanda Costa", telefone: "11987654321", email: "mariafernanda@email.com" },
    { nome: "Beatriz Oliveira", telefone: "11976543210", email: "beatriz.oli@email.com" },
    { nome: "Renata Santos", telefone: "11965432109", email: "renata.santos@email.com" },
    { nome: "Camila Pereira", telefone: "11954321098", email: "camila.p@email.com" },
    { nome: "Larissa Alves", telefone: "11943210987", email: "larissa.alves@email.com" },
    { nome: "Tatiane Rodrigues", telefone: "11932109876", email: "tatiane.r@email.com" },
    { nome: "Priscila Lima", telefone: "11921098765", email: "priscila.lima@email.com" },
    { nome: "Amanda Souza", telefone: "11910987654", email: "amanda.souza@email.com" },
  ];

  const clientes: { id: string }[] = [];
  for (const c of clientesData) {
    const existing = await prisma.cliente.findFirst({
      where: { email: c.email, empresaId: empresa.id },
    });
    if (existing) {
      clientes.push(existing);
    } else {
      const cliente = await prisma.cliente.create({ data: { ...c, empresaId: empresa.id } });
      clientes.push(cliente);
    }
  }

  // Agendamentos — só cria se não houver nenhum ainda (evita duplicatas em re-runs)
  const totalAgendamentos = await prisma.agendamento.count({ where: { empresaId: empresa.id } });
  if (totalAgendamentos > 0) {
    console.log(`✓ Agendamentos já existem (${totalAgendamentos}), pulando.`);
    return;
  }

  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);

  const agendamentosData = [
    { clienteIdx: 0, servicoIdx: 0, funcIdx: 0, salaIdx: 0, diasOffset: 0, hora: "09:00" },
    { clienteIdx: 1, servicoIdx: 2, funcIdx: 1, salaIdx: 2, diasOffset: 0, hora: "10:00" },
    { clienteIdx: 2, servicoIdx: 1, funcIdx: 2, salaIdx: 1, diasOffset: 0, hora: "11:30" },
    { clienteIdx: 3, servicoIdx: 4, funcIdx: 2, salaIdx: 1, diasOffset: 1, hora: "09:00" },
    { clienteIdx: 4, servicoIdx: 3, funcIdx: 1, salaIdx: 2, diasOffset: 1, hora: "14:00" },
    { clienteIdx: 5, servicoIdx: 0, funcIdx: 0, salaIdx: 0, diasOffset: 2, hora: "10:00" },
    { clienteIdx: 6, servicoIdx: 2, funcIdx: 1, salaIdx: 2, diasOffset: 3, hora: "15:00" },
    { clienteIdx: 7, servicoIdx: 1, funcIdx: 2, salaIdx: 1, diasOffset: -1, hora: "11:00" },
  ];

  for (const ag of agendamentosData) {
    const dataAg = new Date(hoje);
    dataAg.setUTCDate(dataAg.getUTCDate() + ag.diasOffset);

    const [h, m] = ag.hora.split(":").map(Number);
    const horaInicio = new Date(dataAg);
    horaInicio.setUTCHours(h, m, 0, 0);

    const servico = servicos[ag.servicoIdx];
    const horaFim = new Date(horaInicio.getTime() + servico.duracao * 60_000);

    const pedido = await prisma.pedido.create({
      data: {
        clienteId: clientes[ag.clienteIdx].id,
        empresaId: empresa.id,
        status: ag.diasOffset < 0 ? "CONCLUIDO" : "AGENDADO",
        servicos: { create: { servicoId: servico.id } },
      },
    });

    const existingAg = await prisma.agendamento.findUnique({ where: { pedidoId: pedido.id } });
    if (!existingAg) {
      await prisma.agendamento.create({
        data: {
          pedidoId: pedido.id,
          funcionarioId: funcionarios[ag.funcIdx].id,
          salaId: salas[ag.salaIdx].id,
          empresaId: empresa.id,
          data: dataAg,
          horaInicio,
          horaFim,
          status: ag.diasOffset < 0 ? "CONCLUIDO" : "AGENDADO",
        },
      });
    }
  }

  console.log(`
✓ Seed completo — Musa Spa & Estética
  Admin: admin@admin.com / admin123
  Funcionários: ${funcionarios.length} (senha: func123)
  Clientes: ${clientes.length}
  Serviços: ${servicos.length}
  Salas: ${salas.length}
  Agendamentos: ${agendamentosData.length}
`);
}

main().finally(() => prisma.$disconnect());
