import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../app";
import { cleanDb } from "../helpers/db";
import { getToken } from "../helpers/auth";
import { prisma } from "../../database/prisma";

let token: string;
let pedidoId: string;
let funcionarioId: string;
let salaId: string;

beforeEach(async () => {
  await cleanDb();
  token = await getToken();

  const cliente = await prisma.cliente.create({ data: { nome: "Ana", telefone: "11999", email: "ana@test.com" } });
  const servico = await prisma.servico.create({ data: { nome: "Corte", descricao: "", duracao: 30, preco: 50 } });
  const sala = await prisma.sala.create({ data: { nome: "Sala A", descricao: "" } });
  const func = await prisma.funcionario.create({
    data: { nome: "Carlos", email: "carlos@test.com", senha: await bcrypt.hash("senha123", 10) },
  });
  await prisma.funcionarioServico.create({ data: { funcionarioId: func.id, servicoId: servico.id } });
  const pedido = await prisma.pedido.create({
    data: { clienteId: cliente.id, servicos: { create: [{ servicoId: servico.id }] } },
  });

  funcionarioId = func.id;
  salaId = sala.id;
  pedidoId = pedido.id;
});

const DATA_FUTURA = "2099-01-15";

async function criarAgendamento(data?: object) {
  return request(app)
    .post("/agendamentos")
    .set("Authorization", `Bearer ${token}`)
    .send(data ?? { pedidoId, funcionarioId, salaId, data: DATA_FUTURA, horaInicio: "09:00" });
}

describe("GET /agendamentos", () => {
  it("retorna lista vazia inicialmente", async () => {
    const res = await request(app).get("/agendamentos").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("filtra por data", async () => {
    await criarAgendamento();
    const com = await request(app)
      .get(`/agendamentos?data=${DATA_FUTURA}`)
      .set("Authorization", `Bearer ${token}`);
    const sem = await request(app).get("/agendamentos?data=2099-02-01").set("Authorization", `Bearer ${token}`);
    expect(com.body).toHaveLength(1);
    expect(sem.body).toHaveLength(0);
  });
});

describe("GET /agendamentos/:id", () => {
  it("retorna agendamento com relações", async () => {
    const created = await criarAgendamento();
    const res = await request(app)
      .get(`/agendamentos/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("funcionario");
    expect(res.body).toHaveProperty("sala");
    expect(res.body.pedido.cliente.nome).toBe("Ana");
  });

  it("retorna 404 para ID inexistente", async () => {
    const res = await request(app)
      .get("/agendamentos/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /agendamentos", () => {
  it("cria agendamento com sucesso e atualiza pedido para AGENDADO", async () => {
    const res = await criarAgendamento();
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("AGENDADO");
    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
    expect(pedido?.status).toBe("AGENDADO");
  });

  it("retorna 409 ao tentar agendar pedido já agendado", async () => {
    await criarAgendamento();
    const res = await criarAgendamento({ pedidoId, funcionarioId, salaId, data: DATA_FUTURA, horaInicio: "11:00" });
    expect(res.status).toBe(409);
  });

  it("retorna 409 quando funcionário não tem especialidade no serviço", async () => {
    const funcSemEsp = await prisma.funcionario.create({
      data: { nome: "Sem Esp", email: "semp@test.com", senha: await bcrypt.hash("123456", 10) },
    });
    const res = await criarAgendamento({ pedidoId, funcionarioId: funcSemEsp.id, salaId, data: DATA_FUTURA, horaInicio: "09:00" });
    expect(res.status).toBe(409);
  });

  it("retorna 409 quando há conflito de horário na sala", async () => {
    const cliente2 = await prisma.cliente.create({ data: { nome: "Bob", telefone: "11888", email: "bob@test.com" } });
    const servico = (await prisma.servico.findFirst())!;
    const pedido2 = await prisma.pedido.create({
      data: { clienteId: cliente2.id, servicos: { create: [{ servicoId: servico.id }] } },
    });
    const func2 = await prisma.funcionario.create({
      data: { nome: "Outro", email: "outro@test.com", senha: await bcrypt.hash("123456", 10) },
    });
    await prisma.funcionarioServico.create({ data: { funcionarioId: func2.id, servicoId: servico.id } });

    await criarAgendamento();
    const res = await criarAgendamento({
      pedidoId: pedido2.id,
      funcionarioId: func2.id,
      salaId,
      data: DATA_FUTURA,
      horaInicio: "09:10",
    });
    expect(res.status).toBe(409);
  });

  it("retorna 400 para formato de data inválido", async () => {
    const res = await criarAgendamento({ pedidoId, funcionarioId, salaId, data: "01/01/2099", horaInicio: "09:00" });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /agendamentos/:id/cancelar", () => {
  it("cancela agendamento e atualiza pedido", async () => {
    const ag = await criarAgendamento();
    const res = await request(app)
      .patch(`/agendamentos/${ag.body.id}/cancelar`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELADO");
    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
    expect(pedido?.status).toBe("CANCELADO");
  });

  it("retorna 409 ao tentar cancelar agendamento já cancelado", async () => {
    const ag = await criarAgendamento();
    await request(app).patch(`/agendamentos/${ag.body.id}/cancelar`).set("Authorization", `Bearer ${token}`);
    const res = await request(app)
      .patch(`/agendamentos/${ag.body.id}/cancelar`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(409);
  });
});

describe("PATCH /agendamentos/:id/concluir", () => {
  it("conclui agendamento e atualiza pedido", async () => {
    const ag = await criarAgendamento();
    const res = await request(app)
      .patch(`/agendamentos/${ag.body.id}/concluir`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CONCLUIDO");
    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
    expect(pedido?.status).toBe("CONCLUIDO");
  });
});
