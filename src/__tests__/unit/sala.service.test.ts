import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../middlewares/AppError";

const mockPrisma = vi.hoisted(() => ({
  sala: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  agendamento: { findFirst: vi.fn() },
}));

vi.mock("../../database/prisma", () => ({ prisma: mockPrisma }));

import { salaService } from "../../modules/sala/sala.service";

const SALA = { id: "sala-1", nome: "Sala A", descricao: "" };

beforeEach(() => vi.clearAllMocks());

describe("salaService.get", () => {
  it("retorna sala quando encontrada", async () => {
    mockPrisma.sala.findUnique.mockResolvedValue(SALA);
    expect(await salaService.get("sala-1")).toEqual(SALA);
  });

  it("lança 404 quando não encontrada", async () => {
    mockPrisma.sala.findUnique.mockResolvedValue(null);
    await expect(salaService.get("x")).rejects.toThrow(new AppError(404, "Sala não encontrada"));
  });
});

describe("salaService.update", () => {
  it("lança 404 quando sala não existe", async () => {
    mockPrisma.sala.findUnique.mockResolvedValue(null);
    await expect(salaService.update("x", { nome: "X" })).rejects.toThrow(AppError);
  });
});

describe("salaService.remove", () => {
  it("lança 409 quando há agendamentos futuros", async () => {
    mockPrisma.sala.findUnique.mockResolvedValue(SALA);
    mockPrisma.agendamento.findFirst.mockResolvedValue({ id: "ag-1" });
    await expect(salaService.remove("sala-1")).rejects.toThrow(
      new AppError(409, "Sala possui agendamentos futuros e não pode ser removida")
    );
    expect(mockPrisma.sala.delete).not.toHaveBeenCalled();
  });

  it("deleta quando não há agendamentos futuros", async () => {
    mockPrisma.sala.findUnique.mockResolvedValue(SALA);
    mockPrisma.agendamento.findFirst.mockResolvedValue(null);
    mockPrisma.sala.delete.mockResolvedValue(SALA);
    await salaService.remove("sala-1");
    expect(mockPrisma.sala.delete).toHaveBeenCalledWith({ where: { id: "sala-1" } });
  });
});
