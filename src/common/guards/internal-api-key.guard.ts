import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(@Inject(ConfigService) private config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const provided = req.headers['x-internal-key'];
    const expected = this.config.get<string>('INTERNAL_API_KEY');
    if (!expected || !provided || provided !== expected) {
      throw new UnauthorizedException('Chave interna inválida ou ausente');
    }
    return true;
  }
}
