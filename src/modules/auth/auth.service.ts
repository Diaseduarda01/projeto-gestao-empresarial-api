import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JwtService) private jwtService: JwtService,
  ) {}

  async login({ email, senha }: LoginDto) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { email } });
    if (!funcionario) throw new UnauthorizedException('Credenciais inválidas');

    const senhaValida = await bcrypt.compare(senha, funcionario.senha);
    if (!senhaValida) throw new UnauthorizedException('Credenciais inválidas');

    const token = this.jwtService.sign({}, { subject: funcionario.id });

    return {
      token,
      funcionario: {
        id: funcionario.id,
        nome: funcionario.nome,
        email: funcionario.email,
      },
    };
  }
}
