import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { EmpresaRepository } from '../empresa/empresa.repository';
import { NotificacaoService } from '../../common/notificacao/notificacao.service';
import { LoginDto } from './dto/login.dto';

const REFRESH_TOKEN_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JwtService) private jwtService: JwtService,
    @Inject(ConfigService) private config: ConfigService,
    @Inject(EmpresaRepository) private empresaRepo: EmpresaRepository,
    @Inject(NotificacaoService) private notificacao: NotificacaoService,
  ) {}

  async login({ email, senha }: LoginDto) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { email } });
    if (!funcionario) throw new UnauthorizedException('Credenciais inválidas');

    const senhaValida = await bcrypt.compare(senha, funcionario.senha);
    if (!senhaValida) throw new UnauthorizedException('Credenciais inválidas');

    if (!funcionario.emailVerificado) {
      throw new UnauthorizedException('E-mail não verificado. Verifique sua caixa de entrada e clique no link de confirmação.');
    }

    if (funcionario.superAdmin) {
      const jti = randomUUID();
      const accessToken = this.jwtService.sign(
        { jti, superAdmin: true, empresaId: '' },
        { subject: funcionario.id, expiresIn: '8h' },
      );
      return {
        accessToken,
        refreshToken: null,
        funcionario: { id: funcionario.id, nome: funcionario.nome, email: funcionario.email },
        superAdmin: true,
      };
    }

    const empresas = await this.prisma.funcionarioEmpresa.findMany({
      where: { funcionarioId: funcionario.id },
      include: { empresa: { select: { id: true, nome: true, slug: true, ativo: true } } },
    });

    const empresasAtivas = empresas.filter((e) => e.empresa.ativo);
    if (!empresasAtivas.length) {
      throw new UnauthorizedException('Funcionário não está vinculado a nenhuma empresa ativa');
    }

    const empresaAtual = empresasAtivas[0];
    const jti = randomUUID();
    const accessToken = this.jwtService.sign(
      { jti, empresaId: empresaAtual.empresaId, papel: empresaAtual.papel },
      { subject: funcionario.id },
    );
    const refreshToken = await this.createRefreshToken(funcionario.id, empresaAtual.empresaId);

    return {
      accessToken,
      refreshToken,
      funcionario: { id: funcionario.id, nome: funcionario.nome, email: funcionario.email },
      empresaAtual: { id: empresaAtual.empresa.id, nome: empresaAtual.empresa.nome, papel: empresaAtual.papel },
      empresas: empresasAtivas.map((e) => ({ id: e.empresa.id, nome: e.empresa.nome, papel: e.papel })),
    };
  }

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    const vinculo = await this.prisma.funcionarioEmpresa.findUnique({
      where: { funcionarioId_empresaId: { funcionarioId: stored.funcionarioId, empresaId: stored.empresaId } },
    });
    if (!vinculo) throw new UnauthorizedException('Vínculo empresa-funcionário não encontrado');

    const jti = randomUUID();
    const accessToken = this.jwtService.sign(
      { jti, empresaId: stored.empresaId, papel: vinculo.papel },
      { subject: stored.funcionarioId },
    );
    const refreshToken = await this.createRefreshToken(stored.funcionarioId, stored.empresaId);

    return { accessToken, refreshToken };
  }

  async trocarEmpresa(userId: string, empresaId: string) {
    const vinculo = await this.prisma.funcionarioEmpresa.findUnique({
      where: { funcionarioId_empresaId: { funcionarioId: userId, empresaId } },
      include: { empresa: { select: { ativo: true, nome: true } } },
    });

    if (!vinculo) throw new UnauthorizedException('Funcionário não está vinculado a esta empresa');
    if (!vinculo.empresa.ativo) throw new UnauthorizedException('Empresa inativa');

    const jti = randomUUID();
    const accessToken = this.jwtService.sign(
      { jti, empresaId, papel: vinculo.papel },
      { subject: userId },
    );
    const refreshToken = await this.createRefreshToken(userId, empresaId);

    return { accessToken, refreshToken, empresaAtual: { id: empresaId, nome: vinculo.empresa.nome, papel: vinculo.papel } };
  }

  async logout(jti: string, exp: number, refreshToken?: string) {
    await this.prisma.blacklistedToken.create({ data: { jti, expiresAt: new Date(exp * 1000) } });

    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async forgotPassword(email: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { email } });
    if (!funcionario) return;

    await this.prisma.passwordResetToken.updateMany({
      where: { funcionarioId: funcionario.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.passwordResetToken.create({ data: { token, funcionarioId: funcionario.id, expiresAt } });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    await this.notificacao.enviarResetSenha(funcionario.email, `${frontendUrl}/redefinir-senha?token=${token}`);
  }

  async resetPassword(token: string, novaSenha: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await this.prisma.$transaction([
      this.prisma.funcionario.update({ where: { id: resetToken.funcionarioId }, data: { senha: senhaHash } }),
      this.prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ]);
  }

  async verificarEmail(token: string) {
    const record = await this.empresaRepo.findEmailVerificationToken(token);
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      this.prisma.funcionario.update({ where: { id: record.funcionarioId }, data: { emailVerificado: true } }),
    ]);
  }

  async aceitarConvite(token: string, senha: string, nome?: string) {
    const convite = await this.empresaRepo.findConviteToken(token);
    if (!convite || convite.usedAt || convite.expiresAt < new Date()) {
      throw new BadRequestException('Convite inválido ou expirado');
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await this.prisma.$transaction(async (tx) => {
      let funcionario = await tx.funcionario.findUnique({ where: { email: convite.email } });
      if (!funcionario) {
        funcionario = await tx.funcionario.create({
          data: { nome: nome ?? convite.nome ?? convite.email.split('@')[0], email: convite.email, senha: senhaHash, emailVerificado: true },
        });
      }
      await tx.funcionarioEmpresa.upsert({
        where: { funcionarioId_empresaId: { funcionarioId: funcionario.id, empresaId: convite.empresaId } },
        update: { papel: convite.papel },
        create: { funcionarioId: funcionario.id, empresaId: convite.empresaId, papel: convite.papel },
      });
      await tx.conviteToken.update({ where: { id: convite.id }, data: { usedAt: new Date() } });
    });

    return { empresaNome: (convite as any).empresa.nome };
  }

  async impersonar(superAdminId: string, empresaId: string) {
    const admin = await this.prisma.funcionario.findUnique({ where: { id: superAdminId } });
    if (!admin?.superAdmin) throw new UnauthorizedException('Acesso negado');

    const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) throw new NotFoundException('Empresa não encontrada');
    if (!empresa.ativo) throw new UnauthorizedException('Empresa inativa');

    const jti = randomUUID();
    const accessToken = this.jwtService.sign(
      { jti, empresaId, papel: 'ADMIN' },
      { subject: superAdminId, expiresIn: '2h' },
    );

    return { accessToken, empresaAtual: { id: empresa.id, nome: empresa.nome, papel: 'ADMIN' } };
  }

  private async createRefreshToken(funcionarioId: string, empresaId: string): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({ data: { token, funcionarioId, empresaId, expiresAt } });
    return token;
  }
}
