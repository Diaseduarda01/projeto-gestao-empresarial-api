import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { UserPayload } from '../decorators/current-user.decorator';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user: UserPayload | undefined = context.switchToHttp().getRequest().user;
    if (!user?.superAdmin) throw new ForbiddenException('Acesso restrito a super administradores');
    return true;
  }
}
