import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { UserPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) config: ConfigService,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; jti: string; exp: number; empresaId: string }): Promise<UserPayload> {
    if (!payload.jti || !payload.empresaId) throw new UnauthorizedException('Token inválido');

    const blacklisted = await this.prisma.blacklistedToken.findUnique({
      where: { jti: payload.jti },
    });
    if (blacklisted) throw new UnauthorizedException('Token revogado');

    const vinculo = await this.prisma.funcionarioEmpresa.findUnique({
      where: {
        funcionarioId_empresaId: {
          funcionarioId: payload.sub,
          empresaId: payload.empresaId,
        },
      },
      include: { empresa: { select: { ativo: true } } },
    });

    if (!vinculo) throw new UnauthorizedException('Acesso não autorizado para esta empresa');
    if (!vinculo.empresa.ativo) throw new UnauthorizedException('Empresa inativa');

    return {
      userId: payload.sub,
      empresaId: payload.empresaId,
      papel: vinculo.papel,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
