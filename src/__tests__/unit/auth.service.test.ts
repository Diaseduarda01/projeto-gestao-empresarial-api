import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnauthorizedException, BadRequestException } from "@nestjs/common";

vi.mock("bcryptjs", () => ({ default: { compare: vi.fn(), hash: vi.fn() } }));
vi.mock("crypto", async (importOriginal) => {
  const mod = await importOriginal<typeof import("crypto")>();
  return { ...mod, randomUUID: vi.fn(() => "test-uuid"), randomBytes: vi.fn(() => ({ toString: () => "reset-token-abc" })) };
});

import bcrypt from "bcryptjs";
import { AuthService } from "../../modules/auth/auth.service";

const EMPRESA = { id: "emp-1", nome: "Empresa X", slug: "empresa-x", ativo: true };
const FUNCIONARIO = { id: "func-1", nome: "Admin", email: "admin@test.com", senha: "hashed", superAdmin: false, emailVerificado: true };
const VINCULO = { empresaId: "emp-1", papel: "ADMIN", empresa: EMPRESA };

const mockPrisma = {
  funcionario: { findUnique: vi.fn(), update: vi.fn() },
  funcionarioEmpresa: { findMany: vi.fn(), findUnique: vi.fn() },
  refreshToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  blacklistedToken: { create: vi.fn() },
  passwordResetToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(),
};

const mockJwt = { sign: vi.fn(() => "access-token-xyz") };
const mockConfig = { get: vi.fn((key: string, fallback?: unknown) => fallback) };
const mockEmpresaRepo = {
  findEmailVerificationToken: vi.fn(),
  markEmailVerificado: vi.fn(),
  useEmailVerificationToken: vi.fn(),
  findConviteToken: vi.fn(),
};

const mockNotificacao = {
  enviarVerificacaoEmail: vi.fn(),
  enviarConvite: vi.fn(),
  enviarAdicionadoAEmpresa: vi.fn(),
  enviarResetSenha: vi.fn(),
};

let authService: AuthService;

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (ops: unknown[]) =>
    Promise.all((ops as Promise<unknown>[]))
  );
  authService = new AuthService(mockPrisma as any, mockJwt as any, mockConfig as any, mockEmpresaRepo as any, mockNotificacao as any);
});

describe("AuthService.login", () => {
  it("lança 401 quando funcionário não existe", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(null);
    await expect(authService.login({ email: "x@x.com", senha: "123" })).rejects.toThrow(
      UnauthorizedException
    );
  });

  it("lança 401 quando senha está errada", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(FUNCIONARIO);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    await expect(authService.login({ email: FUNCIONARIO.email, senha: "errada" })).rejects.toThrow(
      UnauthorizedException
    );
  });

  it("lança 401 quando funcionário não tem empresa ativa", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(FUNCIONARIO);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    mockPrisma.funcionarioEmpresa.findMany.mockResolvedValue([
      { ...VINCULO, empresa: { ...EMPRESA, ativo: false } },
    ]);
    await expect(authService.login({ email: FUNCIONARIO.email, senha: "certa" })).rejects.toThrow(
      UnauthorizedException
    );
  });

  it("retorna accessToken, refreshToken e dados do funcionário no login válido", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(FUNCIONARIO);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    mockPrisma.funcionarioEmpresa.findMany.mockResolvedValue([VINCULO]);
    mockPrisma.refreshToken.create.mockResolvedValue({ token: "refresh-xyz" });

    const result = await authService.login({ email: FUNCIONARIO.email, senha: "certa" });

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(result.funcionario.id).toBe(FUNCIONARIO.id);
    expect(result.empresaAtual!.id).toBe(EMPRESA.id);
    expect(result.empresaAtual!.papel).toBe("ADMIN");
  });
});

describe("AuthService.loginComGoogle", () => {
  const GOOGLE_PROFILE = { googleId: "google-123", email: "admin@test.com", nome: "Admin Google" };

  it("lança 401 quando não há conta vinculada nem por googleId nem por email", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(null);
    await expect(authService.loginComGoogle(GOOGLE_PROFILE)).rejects.toThrow(UnauthorizedException);
    expect(mockPrisma.funcionario.update).not.toHaveBeenCalled();
  });

  it("vincula googleId quando funcionário já existe pelo email", async () => {
    mockPrisma.funcionario.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(FUNCIONARIO);
    mockPrisma.funcionario.update.mockResolvedValue({ ...FUNCIONARIO, googleId: GOOGLE_PROFILE.googleId });
    mockPrisma.funcionarioEmpresa.findMany.mockResolvedValue([VINCULO]);
    mockPrisma.refreshToken.create.mockResolvedValue({ token: "refresh-xyz" });

    const result = await authService.loginComGoogle(GOOGLE_PROFILE);

    expect(mockPrisma.funcionario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FUNCIONARIO.id },
        data: expect.objectContaining({ googleId: GOOGLE_PROFILE.googleId, emailVerificado: true }),
      }),
    );
    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
  });

  it("retorna tokens sem chamar update quando funcionário já tem googleId vinculado", async () => {
    const funcComGoogle = { ...FUNCIONARIO, googleId: GOOGLE_PROFILE.googleId };
    mockPrisma.funcionario.findUnique.mockResolvedValueOnce(funcComGoogle);
    mockPrisma.funcionarioEmpresa.findMany.mockResolvedValue([VINCULO]);
    mockPrisma.refreshToken.create.mockResolvedValue({ token: "refresh-xyz" });

    const result = await authService.loginComGoogle(GOOGLE_PROFILE);

    expect(mockPrisma.funcionario.update).not.toHaveBeenCalled();
    expect(result.empresaAtual!.id).toBe(EMPRESA.id);
  });

  it("lança 401 quando funcionário Google não tem empresa ativa", async () => {
    const funcComGoogle = { ...FUNCIONARIO, googleId: GOOGLE_PROFILE.googleId };
    mockPrisma.funcionario.findUnique.mockResolvedValueOnce(funcComGoogle);
    mockPrisma.funcionarioEmpresa.findMany.mockResolvedValue([]);

    await expect(authService.loginComGoogle(GOOGLE_PROFILE)).rejects.toThrow(UnauthorizedException);
  });
});

describe("AuthService.forgotPassword", () => {
  it("retorna sem erro quando e-mail não existe (previne enumeração de usuários)", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(null);
    await expect(authService.forgotPassword("inexistente@x.com")).resolves.toBeUndefined();
    expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it("cria token de reset e invalida tokens anteriores quando e-mail existe", async () => {
    mockPrisma.funcionario.findUnique.mockResolvedValue(FUNCIONARIO);
    mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.passwordResetToken.create.mockResolvedValue({ token: "reset-abc" });

    await authService.forgotPassword(FUNCIONARIO.email);

    expect(mockPrisma.passwordResetToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { funcionarioId: FUNCIONARIO.id, usedAt: null } })
    );
    expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ funcionarioId: FUNCIONARIO.id }),
      })
    );
  });
});

describe("AuthService.resetPassword", () => {
  it("lança 400 quando token não existe", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);
    await expect(authService.resetPassword("token-invalido", "novaSenha")).rejects.toThrow(
      BadRequestException
    );
  });

  it("lança 400 quando token já foi usado", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "t-1",
      funcionarioId: "func-1",
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600_000),
    });
    await expect(authService.resetPassword("token-usado", "novaSenha")).rejects.toThrow(
      BadRequestException
    );
  });

  it("lança 400 quando token está expirado", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "t-1",
      funcionarioId: "func-1",
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(authService.resetPassword("token-expirado", "novaSenha")).rejects.toThrow(
      BadRequestException
    );
  });

  it("redefine a senha com hash e marca o token como usado", async () => {
    const resetToken = {
      id: "t-1",
      funcionarioId: "func-1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 3600_000),
    };
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(resetToken);
    vi.mocked(bcrypt.hash).mockResolvedValue("nova-senha-hashed" as never);
    mockPrisma.funcionario.update.mockResolvedValue(FUNCIONARIO);
    mockPrisma.passwordResetToken.update.mockResolvedValue({ ...resetToken, usedAt: new Date() });

    await authService.resetPassword("token-valido", "minhaNovaSenha");

    expect(bcrypt.hash).toHaveBeenCalledWith("minhaNovaSenha", 10);
    expect(mockPrisma.funcionario.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { senha: "nova-senha-hashed" } })
    );
    expect(mockPrisma.passwordResetToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { usedAt: expect.any(Date) } })
    );
  });
});
