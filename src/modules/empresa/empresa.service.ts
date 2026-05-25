import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { EmpresaRepository } from './empresa.repository';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { RegistrarEmpresaDto } from './dto/registrar-empresa.dto';
import { ConvidarFuncionarioDto } from './dto/convidar-funcionario.dto';
import { UpsertHorarioFuncionamentoDto } from './dto/horario-funcionamento.dto';
import { UpsertPoliticaCancelamentoDto } from './dto/politica-cancelamento.dto';
import { NotificacaoService } from '../../common/notificacao/notificacao.service';

const CONVITE_TTL_HOURS     = 48;
const EMAIL_VERIFY_TTL_HOURS = 24;

@Injectable()
export class EmpresaService {
  constructor(
    @Inject(EmpresaRepository) private repository: EmpresaRepository,
    @Inject(ConfigService) private config: ConfigService,
    @Inject(NotificacaoService) private notificacao: NotificacaoService,
  ) {}

  async checkSlug(slug: string): Promise<{ disponivel: boolean }> {
    const existing = await this.repository.findBySlug(slug);
    return { disponivel: !existing };
  }

  async registrar(dto: RegistrarEmpresaDto) {
    const existing = await this.repository.findBySlug(dto.slug);
    if (existing) throw new ConflictException('Slug já está em uso');

    const emailExistente = await this.repository.findFuncionarioByEmail(dto.adminEmail);
    if (emailExistente) throw new ConflictException('E-mail já cadastrado');

    const senhaHash = await bcrypt.hash(dto.adminSenha, 10);
    const { empresa, admin } = await this.repository.registrar({
      nome: dto.nome,
      slug: dto.slug,
      adminNome: dto.adminNome,
      adminEmail: dto.adminEmail,
      adminSenha: senhaHash,
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_HOURS * 60 * 60 * 1000);
    await this.repository.createEmailVerificationToken({ token, funcionarioId: admin.id, expiresAt });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    await this.notificacao.enviarVerificacaoEmail(admin.email, admin.nome, `${frontendUrl}/verificar-email?token=${token}`);

    return { empresa: { id: empresa.id, nome: empresa.nome, slug: empresa.slug } };
  }

  async create(dto: CreateEmpresaDto, adminId: string) {
    const existing = await this.repository.findBySlug(dto.slug);
    if (existing) throw new ConflictException('Slug já está em uso');

    const empresa = await this.repository.create({ nome: dto.nome, slug: dto.slug, plano: dto.plano as any });
    await this.repository.vincularFuncionario(adminId, empresa.id, Role.ADMIN);
    return empresa;
  }

  async get(id: string) {
    const empresa = await this.repository.findById(id);
    if (!empresa) throw new NotFoundException('Empresa não encontrada');
    return empresa;
  }

  listFuncionarios(empresaId: string) {
    return this.repository.listFuncionarios(empresaId);
  }

  async convidarFuncionario(empresaId: string, dto: ConvidarFuncionarioDto) {
    const empresa = await this.repository.findById(empresaId);
    if (!empresa) throw new NotFoundException('Empresa não encontrada');

    const funcionarioExistente = await this.repository.findFuncionarioByEmail(dto.email);

    if (funcionarioExistente) {
      await this.repository.vincularFuncionario(funcionarioExistente.id, empresaId, dto.papel as Role);
      const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
      await this.notificacao.enviarAdicionadoAEmpresa(dto.email, empresa.nome, frontendUrl);
      return {
        funcionario: { id: funcionarioExistente.id, nome: funcionarioExistente.nome, email: funcionarioExistente.email },
        papel: dto.papel,
        novo: false,
      };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + CONVITE_TTL_HOURS * 60 * 60 * 1000);
    await this.repository.createConviteToken({
      token,
      email: dto.email,
      nome: dto.nome,
      empresaId,
      papel: dto.papel as Role,
      expiresAt,
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    await this.notificacao.enviarConvite(dto.email, dto.nome ?? dto.email.split('@')[0], empresa.nome, `${frontendUrl}/aceitar-convite?token=${token}`);

    return { email: dto.email, papel: dto.papel, novo: true };
  }

  // HorarioFuncionamento

  listHorarioFuncionamento(empresaId: string) {
    return this.repository.listHorarioFuncionamento(empresaId);
  }

  upsertHorarioFuncionamento(empresaId: string, diaSemana: number, dto: UpsertHorarioFuncionamentoDto) {
    if (diaSemana < 0 || diaSemana > 6) {
      throw new BadRequestException('diaSemana deve ser entre 0 (domingo) e 6 (sábado)');
    }
    return this.repository.upsertHorarioFuncionamento(empresaId, diaSemana, {
      horaAbertura: dto.horaAbertura,
      horaFechamento: dto.horaFechamento,
      ativo: dto.ativo ?? true,
    });
  }

  removeHorarioFuncionamento(empresaId: string, diaSemana: number) {
    return this.repository.removeHorarioFuncionamento(empresaId, diaSemana);
  }

  // PoliticaCancelamento

  getPoliticaCancelamento(empresaId: string) {
    return this.repository.findPoliticaCancelamento(empresaId);
  }

  upsertPoliticaCancelamento(empresaId: string, dto: UpsertPoliticaCancelamentoDto) {
    return this.repository.upsertPoliticaCancelamento(empresaId, {
      prazoMinimoHoras: dto.prazoMinimoHoras,
      multaPercentual: dto.multaPercentual,
    });
  }

  removePoliticaCancelamento(empresaId: string) {
    return this.repository.removePoliticaCancelamento(empresaId);
  }
}
