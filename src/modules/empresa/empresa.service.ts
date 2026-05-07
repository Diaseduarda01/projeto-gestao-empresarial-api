import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Plano, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';
import { EmpresaRepository } from './empresa.repository';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { ConvidarFuncionarioDto } from './dto/convidar-funcionario.dto';

@Injectable()
export class EmpresaService {
  constructor(
    @Inject(EmpresaRepository) private repository: EmpresaRepository,
    @Inject(ConfigService) private config: ConfigService,
  ) {}

  async create(dto: CreateEmpresaDto, adminId: string) {
    const existing = await this.repository.findBySlug(dto.slug);
    if (existing) throw new ConflictException('Slug já está em uso');

    const empresa = await this.repository.create({
      nome: dto.nome,
      slug: dto.slug,
      plano: dto.plano as Plano | undefined,
    });

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

    let funcionario = await this.repository.findFuncionarioByEmail(dto.email);
    let tempPassword: string | undefined;

    if (!funcionario) {
      tempPassword = randomBytes(8).toString('hex');
      const senhaHash = await bcrypt.hash(tempPassword, 10);
      funcionario = await this.repository.createFuncionario({
        nome: dto.nome ?? dto.email.split('@')[0],
        email: dto.email,
        senha: senhaHash,
      });
    }

    await this.repository.vincularFuncionario(funcionario.id, empresaId, dto.papel as Role);

    if (tempPassword) {
      await this.sendInviteEmail(dto.email, empresa.nome, tempPassword);
    }

    return {
      funcionario: { id: funcionario.id, nome: funcionario.nome, email: funcionario.email },
      papel: dto.papel,
      novo: !!tempPassword,
    };
  }

  private async sendInviteEmail(email: string, empresaNome: string, tempPassword: string) {
    const smtpHost = this.config.get<string>('SMTP_HOST');
    if (!smtpHost) {
      if (this.config.get('NODE_ENV') !== 'production') {
        console.log(`[DEV] Convite para ${email} na empresa "${empresaNome}". Senha temporária: ${tempPassword}`);
        return;
      }
      throw new ServiceUnavailableException('Serviço de email não configurado');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: this.config.get<number>('SMTP_PORT', 587),
      auth: { user: this.config.get<string>('SMTP_USER'), pass: this.config.get<string>('SMTP_PASS') },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');

    await transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM', 'noreply@erpdias.com'),
      to: email,
      subject: `Convite para ${empresaNome} — ERP Dias`,
      html: `<p>Você foi convidado para a empresa <b>${empresaNome}</b>.</p>
             <p>Acesse <a href="${frontendUrl}">${frontendUrl}</a> e faça login com:</p>
             <p>Email: ${email}<br>Senha temporária: ${tempPassword}</p>
             <p>Altere sua senha após o primeiro acesso.</p>`,
    });
  }
}
