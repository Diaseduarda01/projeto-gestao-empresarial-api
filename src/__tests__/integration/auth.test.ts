import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { cleanDb } from "../helpers/db";
import { createAdmin, ADMIN } from "../helpers/auth";

beforeEach(async () => {
  await cleanDb();
  await createAdmin();
});

describe("POST /auth/login", () => {
  it("retorna token com credenciais válidas", async () => {
    const res = await request(app).post("/auth/login").send({ email: ADMIN.email, senha: ADMIN.senha });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.funcionario.email).toBe(ADMIN.email);
  });

  it("retorna 401 com senha incorreta", async () => {
    const res = await request(app).post("/auth/login").send({ email: ADMIN.email, senha: "errada" });

    expect(res.status).toBe(401);
  });

  it("retorna 401 com e-mail inexistente", async () => {
    const res = await request(app).post("/auth/login").send({ email: "nao@existe.com", senha: "123456" });

    expect(res.status).toBe(401);
  });

  it("retorna 400 com body inválido", async () => {
    const res = await request(app).post("/auth/login").send({ email: "não-é-email", senha: "" });

    expect(res.status).toBe(400);
  });
});

describe("Rotas protegidas sem token", () => {
  it("retorna 401 ao acessar /clientes sem token", async () => {
    const res = await request(app).get("/clientes");
    expect(res.status).toBe(401);
  });

  it("retorna 401 com token inválido", async () => {
    const res = await request(app).get("/clientes").set("Authorization", "Bearer token-invalido");
    expect(res.status).toBe(401);
  });
});
