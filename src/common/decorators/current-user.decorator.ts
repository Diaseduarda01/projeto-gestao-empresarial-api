import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

export interface UserPayload {
  userId: string;
  empresaId: string;
  papel: Role;
  jti: string;
  exp: number;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UserPayload =>
    ctx.switchToHttp().getRequest().user,
);
