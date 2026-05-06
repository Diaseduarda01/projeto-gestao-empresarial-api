import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClienteModule } from './modules/cliente/cliente.module';
import { ServicoModule } from './modules/servico/servico.module';
import { SalaModule } from './modules/sala/sala.module';
import { FuncionarioModule } from './modules/funcionario/funcionario.module';
import { PedidoModule } from './modules/pedido/pedido.module';
import { AgendamentoModule } from './modules/agendamento/agendamento.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HealthController } from './common/health/health.controller';
import { envSchema } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    PrismaModule,
    AuthModule,
    ClienteModule,
    ServicoModule,
    SalaModule,
    FuncionarioModule,
    PedidoModule,
    AgendamentoModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
