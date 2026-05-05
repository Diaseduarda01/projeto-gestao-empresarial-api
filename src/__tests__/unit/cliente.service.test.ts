import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../middlewares/AppError";

const mockPrisma = vi.hoisted(() => ({
  cliente: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../database/prisma", () => ({ prisma: mockPrisma }));

import { clienteService } from "../../modules/cliente/cliente.service";

const CLIENTE = { id: "uuid-1", nome: "Ana", telefone: "11999", email: "ana@test.com", createdAt: new Date() };

beforeEach(() => vi.clearAllMocks());

describe("clienteService.list", () => {
  it("retorna lista de clientes", async () => {
    mockPrisma.cliente.findMany.mockResolvedValue([CLIENTE]);
    const result = await clienteService.list();
    expect(result).toEqual([CLIENTE]);
    expect(mockPrisma.cliente.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
  });
});

describe("clienteService.get", () => {
  it("retorna cliente quando encontrado", async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(CLIENTE);
    const result = await clienteService.get("uuid-1");
    expect(result).toEqual(CLIENTE);
  });

  it("lança 404 quando não encontrado", async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(null);
    await expect(clienteService.get("uuid-x")).rejects.toThrow(new AppError(404, "Cliente não encontrado"));
  });
});

describe("clienteService.create", () => {
  it("cria e retorna o cliente", async () => {
    mockPrisma.cliente.create.mockResolvedValue(CLIENTE);
    const result = await clienteService.create({ nome: "Ana", telefone: "11999", email: "ana@test.com" });
    expect(result).toEqual(CLIENTE);
    expect(mockPrisma.cliente.create).toHaveBeenCalledWith({ data: { nome: "Ana", telefone: "11999", email: "ana@test.com" } });
  });
});

describe("clienteService.update", () => {
  it("lança 404 quando cliente não existe", async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(null);
    await expect(clienteService.update("uuid-x", { nome: "Novo" })).rejects.toThrow(AppError);
  });

  it("atualiza e retorna o cliente", async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(CLIENTE);
    mockPrisma.cliente.update.mockResolvedValue({ ...CLIENTE, nome: "Novo" });
    const result = await clienteService.update("uuid-1", { nome: "Novo" });
    expect(result.nome).toBe("Novo");
  });
});

describe("clienteService.remove", () => {
  it("lança 404 quando cliente não existe", async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(null);
    await expect(clienteService.remove("uuid-x")).rejects.toThrow(AppError);
  });

  it("deleta quando cliente existe", async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(CLIENTE);
    mockPrisma.cliente.delete.mockResolvedValue(CLIENTE);
    await clienteService.remove("uuid-1");
    expect(mockPrisma.cliente.delete).toHaveBeenCalledWith({ where: { id: "uuid-1" } });
  });
});
