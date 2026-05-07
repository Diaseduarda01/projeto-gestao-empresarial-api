import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClienteModule } from './modules/cliente/cliente.module';
import { ServicoModule } from './modules/servico/servico.module';
import { SalaModule } from './modules/sala/sala.module';
import { FuncionarioModule } from './modules/funcionario/funcionario.module';
import { PedidoModule } from './modules/pedido/pedido.module';
import { AgendamentoModule } from './modules/agendamento/agendamento.module';
import { EmpresaModule } from './modules/empresa/empresa.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthController } from './common/health/health.controller';
import { ETagInterceptor } from './common/interceptors/etag.interceptor';
import { envSchema } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    CacheModule.register({ isGlobal: true, ttl: 60000, max: 200 }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    ClienteModule,
    ServicoModule,
    SalaModule,
    FuncionarioModule,
    PedidoModule,
    AgendamentoModule,
    EmpresaModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: ETagInterceptor },
  ],
})
export class AppModule {}
