import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../middlewares/AppError";

const mockPrisma = vi.hoisted(() => ({
  funcionario: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  agendamento: { findFirst: vi.fn() },
  servico: { findMany: vi.fn() },
  funcionarioServico: {
    findMany: vi.fn(),
    createMany: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../database/prisma", () => ({ prisma: mockPrisma }));

import { funcionarioService } from "../../modules/funcionario/funcionario.service";

const FUNC = { id: "func-1", nome: "João", email: "joao@test.com", createdAt: new Date() };
const FUNC_DB = { ...FUNC, senha: "hashed" };

beforeEach(() => vi.clearAllMocks());

describe("funcionarioService.get", () => {
  it("retorna funcionário sem senha", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(FUNC);
    const result = await funcionarioService.get("func-1");
    expect(result).toEqual(FUNC);
  });

  it("lança 404 quando não encontrado", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(null);
    await expect(funcionarioService.get("x")).rejects.toThrow(new AppError(404, "Funcionário não encontrado"));
  });
});

describe("funcionarioService.create", () => {
  it("cria funcionário com senha hasheada", async () => {
    mockPrisma.funcionario.create.mockResolvedValue(FUNC_DB);
    const result = await funcionarioService.create({ nome: "João", email: "joao@test.com", senha: "123456" });
    expect(result).not.toHaveProperty("senha");
    expect(mockPrisma.funcionario.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ nome: "João" }) })
    );
  });
});

describe("funcionarioService.update", () => {
  it("lança 404 quando funcionário não existe", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(null);
    await expect(funcionarioService.update("x", { nome: "X" })).rejects.toThrow(AppError);
  });

  it("atualiza dados sem alterar senha quando não informada", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(FUNC);
    mockPrisma.funcionario.update.mockResolvedValue(FUNC_DB);
    await funcionarioService.update("func-1", { nome: "Novo" });
    const call = mockPrisma.funcionario.update.mock.calls[0][0];
    expect(call.data.senha).toBeUndefined();
  });

  it("atualiza senha com hash quando informada", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(FUNC);
    mockPrisma.funcionario.update.mockResolvedValue(FUNC_DB);
    await funcionarioService.update("func-1", { senha: "novaSenha" });
    const call = mockPrisma.funcionario.update.mock.calls[0][0];
    expect(call.data.senha).toBeDefined();
    expect(call.data.senha).not.toBe("novaSenha");
  });
});

describe("funcionarioService.remove", () => {
  it("bloqueia remoção com agendamentos futuros (409)", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(FUNC);
    mockPrisma.agendamento.findFirst.mockResolvedValue({ id: "ag-1" });
    await expect(funcionarioService.remove("func-1")).rejects.toThrow(
      new AppError(409, "Funcionário possui agendamentos futuros e não pode ser removido")
    );
    expect(mockPrisma.funcionario.delete).not.toHaveBeenCalled();
  });

  it("deleta quando não há agendamentos futuros", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(FUNC);
    mockPrisma.agendamento.findFirst.mockResolvedValue(null);
    mockPrisma.funcionario.delete.mockResolvedValue(FUNC_DB);
    await funcionarioService.remove("func-1");
    expect(mockPrisma.funcionario.delete).toHaveBeenCalled();
  });
});

describe("funcionarioService.addServicos", () => {
  it("lança 404 quando algum serviço não existe", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(FUNC);
    mockPrisma.servico.findMany.mockResolvedValue([{ id: "s-1" }]);
    mockPrisma.funcionarioServico.findMany.mockResolvedValue([]);
    await expect(funcionarioService.addServicos("func-1", ["s-1", "s-inexistente"])).rejects.toThrow(
      new AppError(404, "Um ou mais serviços não encontrados")
    );
  });
});
