import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { cleanDb } from "../helpers/db";
import { getToken } from "../helpers/auth";

let token: string;

beforeEach(async () => {
  await cleanDb();
  token = await getToken();
});

const PAYLOAD = { nome: "Ana Lima", telefone: "11987654321", email: "ana@test.com" };

async function createCliente(data = PAYLOAD) {
  return request(app).post("/clientes").set("Authorization", `Bearer ${token}`).send(data);
}

describe("GET /clientes", () => {
  it("retorna lista vazia inicialmente", async () => {
    const res = await request(app).get("/clientes").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("retorna clientes criados", async () => {
    await createCliente();
    const res = await request(app).get("/clientes").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].email).toBe(PAYLOAD.email);
  });
});

describe("GET /clientes/:id", () => {
  it("retorna cliente pelo ID", async () => {
    const created = await createCliente();
    const res = await request(app).get(`/clientes/${created.body.id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe(PAYLOAD.nome);
  });

  it("retorna 404 para ID inexistente", async () => {
    const res = await request(app)
      .get("/clientes/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /clientes", () => {
  it("cria cliente com dados válidos", async () => {
    const res = await createCliente();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nome: PAYLOAD.nome, email: PAYLOAD.email });
    expect(res.body).toHaveProperty("id");
  });

  it("retorna 409 para e-mail duplicado", async () => {
    await createCliente();
    const res = await createCliente();
    expect(res.status).toBe(409);
  });

  it("retorna 400 para body inválido", async () => {
    const res = await createCliente({ nome: "", telefone: "999", email: "não-é-email" });
    expect(res.status).toBe(400);
  });
});

describe("PUT /clientes/:id", () => {
  it("atualiza cliente com sucesso", async () => {
    const created = await createCliente();
    const res = await request(app)
      .put(`/clientes/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Nome Novo" });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe("Nome Novo");
  });

  it("retorna 404 para ID inexistente", async () => {
    const res = await request(app)
      .put("/clientes/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "X" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /clientes/:id", () => {
  it("remove cliente com sucesso", async () => {
    const created = await createCliente();
    const res = await request(app)
      .delete(`/clientes/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it("retorna 404 para ID inexistente", async () => {
    const res = await request(app)
      .delete("/clientes/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
