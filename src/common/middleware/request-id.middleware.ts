import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const id =
      ((req as any).id as string | undefined) ||
      (req.headers['x-request-id'] as string | undefined) ||
      randomUUID();
    (req as any).id = id;
    res.setHeader('X-Request-Id', id);
    next();
  }
}
