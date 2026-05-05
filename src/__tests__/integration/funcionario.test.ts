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

const PAYLOAD = { nome: "Maria Souza", email: "maria@test.com", senha: "senha123" };

async function createFuncionario(data = PAYLOAD) {
  return request(app).post("/funcionarios").set("Authorization", `Bearer ${token}`).send(data);
}

describe("GET /funcionarios", () => {
  it("retorna lista de funcionários sem a senha", async () => {
    const res = await request(app).get("/funcionarios").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body[0]).not.toHaveProperty("senha");
  });
});

describe("GET /funcionarios/:id", () => {
  it("retorna funcionário pelo ID", async () => {
    const created = await createFuncionario();
    const res = await request(app).get(`/funcionarios/${created.body.id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(PAYLOAD.email);
    expect(res.body).not.toHaveProperty("senha");
  });

  it("retorna 404 para ID inexistente", async () => {
    const res = await request(app)
      .get("/funcionarios/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /funcionarios", () => {
  it("cria funcionário com sucesso", async () => {
    const res = await createFuncionario();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nome: PAYLOAD.nome, email: PAYLOAD.email });
    expect(res.body).not.toHaveProperty("senha");
  });

  it("retorna 400 para senha curta", async () => {
    const res = await createFuncionario({ ...PAYLOAD, senha: "123" });
    expect(res.status).toBe(400);
  });

  it("retorna 409 para e-mail duplicado", async () => {
    await createFuncionario();
    const res = await createFuncionario();
    expect(res.status).toBe(409);
  });
});

describe("PUT /funcionarios/:id", () => {
  it("atualiza nome com sucesso", async () => {
    const created = await createFuncionario();
    const res = await request(app)
      .put(`/funcionarios/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Novo Nome" });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe("Novo Nome");
  });
});

describe("DELETE /funcionarios/:id", () => {
  it("remove funcionário sem agendamentos", async () => {
    const created = await createFuncionario();
    const res = await request(app)
      .delete(`/funcionarios/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});

describe("GET /POST /DELETE /funcionarios/:id/servicos", () => {
  it("gerencia especialidades do funcionário", async () => {
    const func = await createFuncionario();
    const servico = await prisma.servico.create({ data: { nome: "Corte", descricao: "", duracao: 30, preco: 50 } });
    const funcId = func.body.id;

    const listVazia = await request(app).get(`/funcionarios/${funcId}/servicos`).set("Authorization", `Bearer ${token}`);
    expect(listVazia.status).toBe(200);
    expect(listVazia.body).toHaveLength(0);

    const addRes = await request(app)
      .post(`/funcionarios/${funcId}/servicos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ servicoIds: [servico.id] });
    expect(addRes.status).toBe(201);
    expect(addRes.body).toHaveLength(1);
    expect(addRes.body[0].servico.nome).toBe("Corte");

    const delRes = await request(app)
      .delete(`/funcionarios/${funcId}/servicos/${servico.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(delRes.status).toBe(204);

    const listDepois = await request(app).get(`/funcionarios/${funcId}/servicos`).set("Authorization", `Bearer ${token}`);
    expect(listDepois.body).toHaveLength(0);
  });

  it("retorna 404 ao adicionar serviço inexistente", async () => {
    const func = await createFuncionario();
    const res = await request(app)
      .post(`/funcionarios/${func.body.id}/servicos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ servicoIds: ["00000000-0000-0000-0000-000000000000"] });
    expect(res.status).toBe(404);
  });
});
