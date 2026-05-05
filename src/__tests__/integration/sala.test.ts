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

const PAYLOAD = { nome: "Sala VIP", descricao: "Sala premium" };

async function createSala(data = PAYLOAD) {
  return request(app).post("/salas").set("Authorization", `Bearer ${token}`).send(data);
}

describe("GET /salas", () => {
  it("retorna lista de salas", async () => {
    await createSala();
    const res = await request(app).get("/salas").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe("GET /salas/:id", () => {
  it("retorna sala pelo ID", async () => {
    const created = await createSala();
    const res = await request(app).get(`/salas/${created.body.id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe(PAYLOAD.nome);
  });

  it("retorna 404 para ID inexistente", async () => {
    const res = await request(app)
      .get("/salas/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /salas", () => {
  it("cria sala com sucesso", async () => {
    const res = await createSala();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nome: PAYLOAD.nome });
  });

  it("cria sala sem descricao (usa default vazio)", async () => {
    const res = await createSala({ nome: "Sala Simples", descricao: "" });
    expect(res.status).toBe(201);
    expect(res.body.descricao).toBe("");
  });

  it("retorna 400 para nome vazio", async () => {
    const res = await createSala({ nome: "", descricao: "" });
    expect(res.status).toBe(400);
  });
});

describe("PUT /salas/:id", () => {
  it("atualiza sala com sucesso", async () => {
    const created = await createSala();
    const res = await request(app)
      .put(`/salas/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Sala Atualizada" });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe("Sala Atualizada");
  });

  it("retorna 404 para ID inexistente", async () => {
    const res = await request(app)
      .put("/salas/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "X" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /salas/:id", () => {
  it("remove sala sem agendamentos", async () => {
    const created = await createSala();
    const res = await request(app)
      .delete(`/salas/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it("retorna 404 para ID inexistente", async () => {
    const res = await request(app)
      .delete("/salas/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
