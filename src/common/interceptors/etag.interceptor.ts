import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { createHash } from 'crypto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<{ method: string; headers: Record<string, string> }>();
    if (req.method !== 'GET') return next.handle();

    const res = context.switchToHttp().getResponse<{
      setHeader(name: string, value: string): void;
      status(code: number): { end(): void };
    }>();

    return next.handle().pipe(
      map((data) => {
        if (data === undefined || data === null) return data;

        const etag = `"${createHash('md5').update(JSON.stringify(data)).digest('hex')}"`;
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'private, no-cache');

        if (req.headers['if-none-match'] === etag) {
          res.status(304).end();
          return;
        }

        return data;
      }),
    );
  }
}
