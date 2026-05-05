import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { cleanDb } from "../helpers/db";
import { getToken } from "../helpers/auth";
import { prisma } from "../../database/prisma";

let token: string;
let clienteId: string;
let servicoId: string;

beforeEach(async () => {
  await cleanDb();
  token = await getToken();
  const c = await prisma.cliente.create({ data: { nome: "Ana", telefone: "11999", email: "ana@test.com" } });
  const s = await prisma.servico.create({ data: { nome: "Corte", descricao: "", duracao: 30, preco: 50 } });
  clienteId = c.id;
  servicoId = s.id;
});

async function createPedido(data?: object) {
  return request(app)
    .post("/pedidos")
    .set("Authorization", `Bearer ${token}`)
    .send(data ?? { clienteId, servicoIds: [servicoId] });
}

describe("GET /pedidos", () => {
  it("retorna lista de pedidos com relações", async () => {
    await createPedido();
    const res = await request(app).get("/pedidos").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty("cliente");
    expect(res.body[0]).toHaveProperty("servicos");
  });
});

describe("GET /pedidos/:id", () => {
  it("retorna pedido com relações completas", async () => {
    const created = await createPedido();
    const res = await request(app).get(`/pedidos/${created.body.id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.servicos[0].servico.nome).toBe("Corte");
  });

  it("retorna 404 para ID inexistente", async () => {
    const res = await request(app)
      .get("/pedidos/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /pedidos", () => {
  it("cria pedido com status ABERTO", async () => {
    const res = await createPedido();
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("ABERTO");
    expect(res.body.servicos).toHaveLength(1);
  });

  it("retorna 404 quando cliente não existe", async () => {
    const res = await createPedido({ clienteId: "00000000-0000-0000-0000-000000000000", servicoIds: [servicoId] });
    expect(res.status).toBe(404);
  });

  it("retorna 404 quando serviço não existe", async () => {
    const res = await createPedido({ clienteId, servicoIds: ["00000000-0000-0000-0000-000000000000"] });
    expect(res.status).toBe(404);
  });

  it("retorna 400 quando servicoIds está vazio", async () => {
    const res = await createPedido({ clienteId, servicoIds: [] });
    expect(res.status).toBe(400);
  });
});

describe("POST /pedidos/:id/servicos", () => {
  it("adiciona serviço a pedido ABERTO", async () => {
    const s2 = await prisma.servico.create({ data: { nome: "Escova", descricao: "", duracao: 20, preco: 30 } });
    const created = await createPedido();
    const res = await request(app)
      .post(`/pedidos/${created.body.id}/servicos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ servicoIds: [s2.id] });
    expect(res.status).toBe(200);
    expect(res.body.servicos).toHaveLength(2);
  });

  it("retorna 409 ao adicionar serviço a pedido não-ABERTO", async () => {
    const created = await createPedido();
    await prisma.pedido.update({ where: { id: created.body.id }, data: { status: "CANCELADO" } });
    const res = await request(app)
      .post(`/pedidos/${created.body.id}/servicos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ servicoIds: [servicoId] });
    expect(res.status).toBe(409);
  });
});

describe("PATCH /pedidos/:id/cancelar", () => {
  it("cancela pedido ABERTO", async () => {
    const created = await createPedido();
    const res = await request(app)
      .patch(`/pedidos/${created.body.id}/cancelar`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELADO");
  });

  it("retorna 409 ao cancelar pedido já cancelado", async () => {
    const created = await createPedido();
    await request(app).patch(`/pedidos/${created.body.id}/cancelar`).set("Authorization", `Bearer ${token}`);
    const res = await request(app)
      .patch(`/pedidos/${created.body.id}/cancelar`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(409);
  });
});
