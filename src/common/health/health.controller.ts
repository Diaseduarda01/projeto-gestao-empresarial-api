import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, db: 'connected' };
    } catch {
      throw new HttpException({ ok: false, db: 'disconnected' }, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Public()
  @Get('live')
  @HttpCode(HttpStatus.OK)
  live() {
    return { ok: true, timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, db: 'connected', timestamp: new Date().toISOString() };
    } catch {
      throw new HttpException({ ok: false, db: 'disconnected' }, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
