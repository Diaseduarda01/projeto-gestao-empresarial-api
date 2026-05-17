import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClienteModule } from './modules/cliente/cliente.module';
import { ServicoModule } from './modules/servico/servico.module';
import { SalaModule } from './modules/sala/sala.module';
import { FuncionarioModule } from './modules/funcionario/funcionario.module';
import { PedidoModule } from './modules/pedido/pedido.module';
import { AgendamentoModule } from './modules/agendamento/agendamento.module';
import { EmpresaModule } from './modules/empresa/empresa.module';
import { PlatformAdminModule } from './modules/platform-admin/platform-admin.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthController } from './common/health/health.controller';
import { ETagInterceptor } from './common/interceptors/etag.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AuditModule } from './common/audit/audit.module';
import { NotificacaoModule } from './common/notificacao/notificacao.module';
import { envSchema } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get<string>('NODE_ENV') !== 'production';
        return {
          pinoHttp: {
            level: isDev ? 'debug' : 'info',
            transport: isDev
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:standard',
                  },
                }
              : undefined,
            genReqId: (req: any) =>
              (req.id as string | undefined) ||
              (req.headers['x-request-id'] as string | undefined) ||
              randomUUID(),
            customProps: (req: any) => ({
              ...(req.user?.userId ? { userId: req.user.userId } : {}),
              ...(req.user?.empresaId ? { empresaId: req.user.empresaId } : {}),
            }),
            serializers: {
              req: (req: any) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res: any) => ({ statusCode: res.statusCode }),
            },
          },
        };
      },
    }),
    CacheModule.register({ isGlobal: true, ttl: 60000, max: 200 }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuditModule,
    NotificacaoModule,
    AuthModule,
    ClienteModule,
    ServicoModule,
    SalaModule,
    FuncionarioModule,
    PedidoModule,
    AgendamentoModule,
    EmpresaModule,
    PlatformAdminModule,
    ChatbotModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: ETagInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
