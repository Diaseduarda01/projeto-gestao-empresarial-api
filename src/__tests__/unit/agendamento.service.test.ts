import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../middlewares/AppError";

const mockPrisma = vi.hoisted(() => ({
  agendamento: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  pedido: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  funcionario: { findUnique: vi.fn() },
  sala: { findUnique: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("../../database/prisma", () => ({ prisma: mockPrisma }));

import { agendamentoService } from "../../modules/agendamento/agendamento.service";

const SERVICO = { id: "s-1", nome: "Corte", descricao: "", duracao: 30, preco: 50 };
const PEDIDO_BASE = {
  id: "p-1",
  clienteId: "c-1",
  status: "ABERTO",
  createdAt: new Date(),
  agendamento: null,
  servicos: [{ servicoId: "s-1", servico: SERVICO }],
};
const FUNC_BASE = {
  id: "func-1",
  nome: "Maria",
  email: "maria@test.com",
  senha: "h",
  createdAt: new Date(),
  servicos: [{ servicoId: "s-1" }],
};
const SALA_BASE = { id: "sala-1", nome: "Sala A", descricao: "" };
const AG_BASE = {
  id: "ag-1",
  pedidoId: "p-1",
  funcionarioId: "func-1",
  salaId: "sala-1",
  data: new Date(),
  horaInicio: new Date(),
  horaFim: new Date(),
  status: "AGENDADO",
};

const INPUT = {
  pedidoId: "p-1",
  funcionarioId: "func-1",
  salaId: "sala-1",
  data: "2026-12-01",
  horaInicio: "09:00",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockPrisma) => Promise<unknown>) =>
    cb(mockPrisma)
  );
});

describe("agendamentoService.get", () => {
  it("lança 404 quando não encontrado", async () => {
    mockPrisma.agendamento.findUnique.mockResolvedValue(null);
    await expect(agendamentoService.get("x")).rejects.toThrow(new AppError(404, "Agendamento não encontrado"));
  });
});

describe("agendamentoService.create", () => {
  it("lança 404 quando pedido não existe", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(null);
    await expect(agendamentoService.create(INPUT)).rejects.toThrow(new AppError(404, "Pedido não encontrado"));
  });

  it("lança 409 quando pedido já tem agendamento", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue({ ...PEDIDO_BASE, agendamento: AG_BASE });
    await expect(agendamentoService.create(INPUT)).rejects.toThrow(new AppError(409, "Pedido já possui agendamento"));
  });

  it("lança 400 quando pedido não tem serviços", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue({ ...PEDIDO_BASE, servicos: [] });
    await expect(agendamentoService.create(INPUT)).rejects.toThrow(new AppError(400, "Pedido não possui serviços"));
  });

  it("lança 409 quando pedido está cancelado", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue({ ...PEDIDO_BASE, status: "CANCELADO" });
    await expect(agendamentoService.create(INPUT)).rejects.toThrow(new AppError(409, "Pedido está cancelado"));
  });

  it("lança 404 quando funcionário não existe", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(PEDIDO_BASE);
    mockPrisma.funcionario.findUnique.mockResolvedValue(null);
    await expect(agendamentoService.create(INPUT)).rejects.toThrow(new AppError(404, "Funcionário não encontrado"));
  });

  it("lança 404 quando sala não existe", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(PEDIDO_BASE);
    mockPrisma.funcionario.findUnique.mockResolvedValue(FUNC_BASE);
    mockPrisma.sala.findUnique.mockResolvedValue(null);
    await expect(agendamentoService.create(INPUT)).rejects.toThrow(new AppError(404, "Sala não encontrada"));
  });

  it("lança 409 quando funcionário não tem especialidade no serviço", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(PEDIDO_BASE);
    mockPrisma.funcionario.findUnique.mockResolvedValue({ ...FUNC_BASE, servicos: [] });
    mockPrisma.sala.findUnique.mockResolvedValue(SALA_BASE);
    await expect(agendamentoService.create(INPUT)).rejects.toThrow(AppError);
  });

  it("lança 409 quando há conflito de horário (dentro da transaction)", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(PEDIDO_BASE);
    mockPrisma.funcionario.findUnique.mockResolvedValue(FUNC_BASE);
    mockPrisma.sala.findUnique.mockResolvedValue(SALA_BASE);
    mockPrisma.agendamento.findMany.mockResolvedValue([AG_BASE]);
    await expect(agendamentoService.create(INPUT)).rejects.toThrow(AppError);
  });

  it("cria agendamento com sucesso e atualiza status do pedido", async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(PEDIDO_BASE);
    mockPrisma.funcionario.findUnique.mockResolvedValue(FUNC_BASE);
    mockPrisma.sala.findUnique.mockResolvedValue(SALA_BASE);
    mockPrisma.agendamento.findMany.mockResolvedValue([]);
    mockPrisma.agendamento.create.mockResolvedValue(AG_BASE);
    mockPrisma.pedido.update.mockResolvedValue({ ...PEDIDO_BASE, status: "AGENDADO" });

    await agendamentoService.create(INPUT);

    expect(mockPrisma.agendamento.create).toHaveBeenCalled();
    expect(mockPrisma.pedido.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "AGENDADO" } })
    );
  });
});

describe("agendamentoService.cancel", () => {
  it("lança 404 quando não encontrado", async () => {
    mockPrisma.agendamento.findUnique.mockResolvedValue(null);
    await expect(agendamentoService.cancel("x")).rejects.toThrow(new AppError(404, "Agendamento não encontrado"));
  });

  it("lança 409 quando status não é AGENDADO", async () => {
    mockPrisma.agendamento.findUnique.mockResolvedValue({ ...AG_BASE, status: "CANCELADO" });
    await expect(agendamentoService.cancel("ag-1")).rejects.toThrow(AppError);
  });

  it("cancela e atualiza pedido", async () => {
    mockPrisma.agendamento.findUnique.mockResolvedValue(AG_BASE);
    mockPrisma.agendamento.update.mockResolvedValue({ ...AG_BASE, status: "CANCELADO" });
    mockPrisma.pedido.update.mockResolvedValue({ id: "p-1", status: "CANCELADO" });
    await agendamentoService.cancel("ag-1");
    expect(mockPrisma.agendamento.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "CANCELADO" } })
    );
  });
});

describe("agendamentoService.conclude", () => {
  it("lança 409 quando status não é AGENDADO", async () => {
    mockPrisma.agendamento.findUnique.mockResolvedValue({ ...AG_BASE, status: "CONCLUIDO" });
    await expect(agendamentoService.conclude("ag-1")).rejects.toThrow(AppError);
  });

  it("conclui e atualiza pedido", async () => {
    mockPrisma.agendamento.findUnique.mockResolvedValue(AG_BASE);
    mockPrisma.agendamento.update.mockResolvedValue({ ...AG_BASE, status: "CONCLUIDO" });
    mockPrisma.pedido.update.mockResolvedValue({ id: "p-1", status: "CONCLUIDO" });
    await agendamentoService.conclude("ag-1");
    expect(mockPrisma.pedido.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "CONCLUIDO" } })
    );
  });
});
