import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    let dbUrl = process.env.DATABASE_URL!;
    if (!dbUrl.includes('connection_limit=')) {
      const sep = dbUrl.includes('?') ? '&' : '?';
      dbUrl += `${sep}connection_limit=${process.env.DB_CONNECTION_LIMIT ?? '10'}`;
    }
    super({ datasources: { db: { url: dbUrl } } });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
