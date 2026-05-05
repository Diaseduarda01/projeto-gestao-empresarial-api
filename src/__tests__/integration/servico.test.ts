import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { cleanDb } from "../helpers/db";
import { getToken } from "../helpers/auth";
import { prisma } from "../../database/prisma";

let token: string;

beforeEach(async () => {
  await cleanDb();
  token = await getToken();
});

const PAYLOAD = { nome: "Hidratação", descricao: "Tratamento capilar", duracao: 60, preco: 80 };

async function createServico(data = PAYLOAD) {
  return request(app).post("/servicos").set("Authorization", `Bearer ${token}`).send(data);
}

describe("GET /servicos", () => {
  it("retorna lista de serviços", async () => {
    await createServico();
    const res = await request(app).get("/servicos").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe("GET /servicos/:id", () => {
  it("retorna serviço pelo ID", async () => {
    const created = await createServico();
    const res = await request(app).get(`/servicos/${created.body.id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe(PAYLOAD.nome);
  });

  it("retorna 404 para ID inexistente", async () => {
    const res = await request(app)
      .get("/servicos/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /servicos", () => {
  it("cria serviço com sucesso", async () => {
    const res = await createServico();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nome: PAYLOAD.nome, duracao: PAYLOAD.duracao });
  });

  it("retorna 400 para duração inválida (zero)", async () => {
    const res = await createServico({ ...PAYLOAD, duracao: 0 });
    expect(res.status).toBe(400);
  });

  it("retorna 400 para preço negativo", async () => {
    const res = await createServico({ ...PAYLOAD, preco: -1 });
    expect(res.status).toBe(400);
  });
});

describe("PUT /servicos/:id", () => {
  it("atualiza serviço com sucesso", async () => {
    const created = await createServico();
    const res = await request(app)
      .put(`/servicos/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ preco: 100 });
    expect(res.status).toBe(200);
    expect(Number(res.body.preco)).toBe(100);
  });

  it("retorna 404 para ID inexistente", async () => {
    const res = await request(app)
      .put("/servicos/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "X" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /servicos/:id", () => {
  it("remove serviço sem pedidos vinculados", async () => {
    const created = await createServico();
    const res = await request(app)
      .delete(`/servicos/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it("retorna 409 quando serviço está vinculado a um pedido", async () => {
    const servico = await createServico();
    const cliente = await prisma.cliente.create({ data: { nome: "X", telefone: "999", email: "x@x.com" } });
    await prisma.pedido.create({
      data: { clienteId: cliente.id, servicos: { create: [{ servicoId: servico.body.id }] } },
    });
    const res = await request(app)
      .delete(`/servicos/${servico.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(409);
  });
});
