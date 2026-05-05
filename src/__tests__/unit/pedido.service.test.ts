import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../middlewares/AppError";

const mockPrisma = vi.hoisted(() => ({
  pedido: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  cliente: { findUnique: vi.fn() },
  servico: { findMany: vi.fn() },
  pedidoServico: { createMany: vi.fn() },
}));

vi.mock("../../database/prisma", () => ({ prisma: mockPrisma }));

import { pedidoService } from "../../modules/pedido/pedido.service";

const PEDIDO = { id: "p-1", clienteId: "c-1", status: "ABERTO", createdAt: new Date() };
const CLIENTE = { id: "c-1", nome: "Ana", telefone: "11999", email: "ana@test.com", createdAt: new Date() };
const SERVICO = { id: "s-1", nome: "Corte", descricao: "", duracao: 30, preco: 50 };

beforeEach(() => vi.clearAllMocks());

describe("pedidoService.get", () => {
  it("lança 404 quando pedido não encontrado", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(null);
    await expect(pedidoService.get("x")).rejects.toThrow(new AppError(404, "Pedido não encontrado"));
  });
});

describe("pedidoService.create", () => {
  it("lança 404 quando cliente não existe", async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(null);
    await expect(pedidoService.create({ clienteId: "c-x", servicoIds: ["s-1"] })).rejects.toThrow(
      new AppError(404, "Cliente não encontrado")
    );
  });

  it("lança 404 quando algum serviço não existe", async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(CLIENTE);
    mockPrisma.servico.findMany.mockResolvedValue([SERVICO]);
    await expect(pedidoService.create({ clienteId: "c-1", servicoIds: ["s-1", "s-inexistente"] })).rejects.toThrow(
      new AppError(404, "Um ou mais serviços não encontrados")
    );
  });

  it("cria pedido quando dados válidos", async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue(CLIENTE);
    mockPrisma.servico.findMany.mockResolvedValue([SERVICO]);
    const pedidoComServicos = { ...PEDIDO, cliente: CLIENTE, servicos: [{ servicoId: "s-1", servico: SERVICO }], agendamento: null };
    mockPrisma.pedido.create.mockResolvedValue(pedidoComServicos);
    const result = await pedidoService.create({ clienteId: "c-1", servicoIds: ["s-1"] });
    expect(result.clienteId).toBe("c-1");
  });
});

describe("pedidoService.addServicos", () => {
  it("lança 404 quando pedido não existe", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(null);
    await expect(pedidoService.addServicos("p-x", ["s-1"])).rejects.toThrow(
      new AppError(404, "Pedido não encontrado")
    );
  });

  it("lança 409 quando pedido não está ABERTO", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue({ ...PEDIDO, status: "AGENDADO" });
    await expect(pedidoService.addServicos("p-1", ["s-1"])).rejects.toThrow(AppError);
  });

  it("lança 404 quando algum serviço não existe", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(PEDIDO);
    mockPrisma.servico.findMany.mockResolvedValue([]);
    await expect(pedidoService.addServicos("p-1", ["s-inexistente"])).rejects.toThrow(
      new AppError(404, "Um ou mais serviços não encontrados")
    );
  });
});

describe("pedidoService.cancel", () => {
  it("lança 404 quando pedido não existe", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(null);
    await expect(pedidoService.cancel("x")).rejects.toThrow(new AppError(404, "Pedido não encontrado"));
  });

  it("lança 409 quando pedido já cancelado", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue({ ...PEDIDO, status: "CANCELADO" });
    await expect(pedidoService.cancel("p-1")).rejects.toThrow(new AppError(409, "Pedido já está cancelado"));
  });

  it("lança 409 quando pedido já concluído", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue({ ...PEDIDO, status: "CONCLUIDO" });
    await expect(pedidoService.cancel("p-1")).rejects.toThrow(AppError);
  });

  it("cancela pedido ABERTO com sucesso", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(PEDIDO);
    mockPrisma.pedido.update.mockResolvedValue({ ...PEDIDO, status: "CANCELADO" });
    const result = await pedidoService.cancel("p-1");
    expect(result.status).toBe("CANCELADO");
  });
});
