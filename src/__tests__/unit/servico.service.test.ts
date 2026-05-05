import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../middlewares/AppError";

const mockPrisma = vi.hoisted(() => ({
  servico: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  pedidoServico: { findFirst: vi.fn() },
}));

vi.mock("../../database/prisma", () => ({ prisma: mockPrisma }));

import { servicoService } from "../../modules/servico/servico.service";

const SERVICO = { id: "svc-1", nome: "Corte", descricao: "", duracao: 30, preco: 50 };

beforeEach(() => vi.clearAllMocks());

describe("servicoService.get", () => {
  it("retorna serviço quando encontrado", async () => {
    mockPrisma.servico.findUnique.mockResolvedValue(SERVICO);
    expect(await servicoService.get("svc-1")).toEqual(SERVICO);
  });

  it("lança 404 quando não encontrado", async () => {
    mockPrisma.servico.findUnique.mockResolvedValue(null);
    await expect(servicoService.get("x")).rejects.toThrow(new AppError(404, "Serviço não encontrado"));
  });
});

describe("servicoService.update", () => {
  it("lança 404 quando serviço não existe", async () => {
    mockPrisma.servico.findUnique.mockResolvedValue(null);
    await expect(servicoService.update("x", { nome: "X" })).rejects.toThrow(AppError);
  });

  it("atualiza quando encontrado", async () => {
    mockPrisma.servico.findUnique.mockResolvedValue(SERVICO);
    mockPrisma.servico.update.mockResolvedValue({ ...SERVICO, nome: "Novo" });
    const result = await servicoService.update("svc-1", { nome: "Novo" });
    expect(result.nome).toBe("Novo");
  });
});

describe("servicoService.remove", () => {
  it("lança 409 quando serviço está em uso em pedidos", async () => {
    mockPrisma.servico.findUnique.mockResolvedValue(SERVICO);
    mockPrisma.pedidoServico.findFirst.mockResolvedValue({ pedidoId: "p-1", servicoId: "svc-1" });
    await expect(servicoService.remove("svc-1")).rejects.toThrow(
      new AppError(409, "Serviço está vinculado a pedidos e não pode ser removido")
    );
    expect(mockPrisma.servico.delete).not.toHaveBeenCalled();
  });

  it("deleta quando não está em uso", async () => {
    mockPrisma.servico.findUnique.mockResolvedValue(SERVICO);
    mockPrisma.pedidoServico.findFirst.mockResolvedValue(null);
    mockPrisma.servico.delete.mockResolvedValue(SERVICO);
    await servicoService.remove("svc-1");
    expect(mockPrisma.servico.delete).toHaveBeenCalledWith({ where: { id: "svc-1" } });
  });
});
