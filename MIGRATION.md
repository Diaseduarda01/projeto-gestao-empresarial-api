# Plano de Migração: Express → NestJS

Migração incremental por módulo, preservando 100% da lógica de negócio.
Os services atuais não dependem de `Request`/`Response` do Express — apenas de `prisma` e `AppError` —
portanto toda a lógica pode ser transplantada com mudança mínima.

---

## Decisões de Arquitetura

### Features do NestJS a usar

| Feature | Substitui | Detalhe |
|---|---|---|
| **Guards** (`JwtAuthGuard` + `RolesGuard`) | `authMiddleware` | Registrados globalmente via `APP_GUARD`. `@Public()` libera rotas abertas |
| **ExceptionFilter** (`AllExceptionsFilter`) | `errorHandler.ts` | Trata `HttpException`, `PrismaError`, `ZodError` e fallback 500 |
| **ZodValidationPipe** (nestjs-zod) | `validate` middleware | Global em `main.ts`. DTO = `createZodDto(schema)` |
| **ParseUUIDPipe** (nativo) | ausente | Aplicado em cada `@Param('id')` |
| **Interceptors** | — | `LoggingInterceptor` (pino) + `TransformInterceptor` (envelope de lista) |
| **@nestjs/throttler** | ausente | Rate limiting no login — `@Throttle({ default: { ttl: 60, limit: 5 } })` |
| **@nestjs/swagger** | swagger.ts manual | Gerado automaticamente via decorators + `patchNestJsSwagger()` |
| **@nestjs/config** | `config/env.ts` | Validação do `.env` com Zod no startup |

### Features a NÃO usar
- Microservices, GraphQL, WebSockets — fora de escopo
- Pipes de transformação além de UUID — Zod já faz isso

---

## Estrutura de Pastas Alvo

```
src/
  main.ts                              # bootstrap NestJS
  app.module.ts                        # AppModule raiz

  common/
    decorators/
      current-user.decorator.ts        # @CurrentUser()
      public.decorator.ts              # @Public()
      roles.decorator.ts               # @Roles()
    filters/
      all-exceptions.filter.ts         # ExceptionFilter global
    guards/
      jwt-auth.guard.ts
      roles.guard.ts
    interceptors/
      logging.interceptor.ts
      transform.interceptor.ts
    pagination/
      pagination.dto.ts
      pagination.helper.ts             # take/skip + meta

  config/
    env.ts                             # @nestjs/config + Zod schema

  database/
    prisma.module.ts                   # @Global()
    prisma.service.ts                  # extends PrismaClient + OnModuleInit

  modules/
    auth/
      auth.module.ts
      auth.controller.ts               # POST /auth/login, POST /auth/refresh
      auth.service.ts
      strategies/jwt.strategy.ts       # PassportStrategy
      dto/login.dto.ts
      dto/refresh-token.dto.ts

    empresa/
      empresa.module.ts
      empresa.controller.ts
      empresa.service.ts
      empresa.repository.ts
      dto/create-empresa.dto.ts

    funcionario/
      funcionario.module.ts
      funcionario.controller.ts
      funcionario.service.ts
      funcionario.repository.ts
      dto/create-funcionario.dto.ts
      dto/update-funcionario.dto.ts
      dto/add-servicos.dto.ts

    cliente/
      cliente.module.ts
      cliente.controller.ts
      cliente.service.ts
      cliente.repository.ts
      dto/create-cliente.dto.ts
      dto/update-cliente.dto.ts

    servico/
      servico.module.ts
      servico.controller.ts
      servico.service.ts
      servico.repository.ts
      dto/create-servico.dto.ts
      dto/update-servico.dto.ts

    sala/
      sala.module.ts
      sala.controller.ts
      sala.service.ts
      sala.repository.ts
      dto/create-sala.dto.ts
      dto/update-sala.dto.ts

    pedido/
      pedido.module.ts
      pedido.controller.ts
      pedido.service.ts
      pedido.repository.ts
      dto/create-pedido.dto.ts
      dto/add-servicos.dto.ts

    agendamento/
      agendamento.module.ts
      agendamento.controller.ts
      agendamento.service.ts
      agendamento.repository.ts
      dto/create-agendamento.dto.ts
      dto/filter-agendamento.dto.ts

  __tests__/
    helpers/
      nest-app.ts                      # inicializa NestApp para testes
      auth.ts
      db.ts
    integration/*.test.ts
    unit/*.service.spec.ts
```

---

## Dependências

### Instalar

```bash
# Core NestJS
npm i @nestjs/core @nestjs/common @nestjs/platform-express @nestjs/config

# Auth
npm i @nestjs/passport @nestjs/jwt passport passport-jwt
npm i -D @types/passport-jwt

# Rate limiting
npm i @nestjs/throttler

# Swagger automático
npm i @nestjs/swagger

# Zod + NestJS
npm i nestjs-zod

# Logs estruturados
npm i pino pino-http pino-pretty nestjs-pino

# Segurança
npm i helmet
```

### Remover após migração completa

```bash
npm uninstall express express-async-errors @types/express cors @types/cors swagger-ui-express @types/swagger-ui-express
```

### Manter sem alteração

```
@prisma/client  prisma  bcryptjs  jsonwebtoken  zod  vitest  supertest
```

### Ajustar tsconfig.json

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false
  }
}
```

`strictPropertyInitialization: false` é necessário para DI do NestJS.
`strict: true` permanece — as outras verificações continuam ativas.

---

## Sequência de Migração

Grafo de dependências dos services determina a ordem:
- `auth`, `cliente`, `servico`, `sala` — folhas (sem dependências cruzadas)
- `funcionario` depende de `agendamento` (verifica agendamentos futuros)
- `pedido` depende de `cliente` e `servico`
- `agendamento` depende de tudo — migrar por último

```
Fase 0  Setup do projeto NestJS (infraestrutura)
Fase 1  PrismaService + ConfigModule
Fase 2  Auth + Guards + Filter + Pipe global
Fase 3  ClienteModule (módulo mais simples, já tem controller)
Fase 4  ServicoModule + SalaModule (folhas)
Fase 5  FuncionarioModule (tem sub-recurso /servicos)
Fase 6  PedidoModule (depende de Cliente e Servico)
Fase 7  AgendamentoModule (mais complexo, preservar transaction)
Fase 8  Empresa + Multitenancy (schema Prisma + filtro por empresaId)
Fase 9  RBAC (role no Funcionario, guards nos endpoints)
Fase 10 Features transversais (throttle, helmet, paginação, logs, Swagger)
Fase 11 Refresh token + limpeza (remover Express, ajustar docker-compose, CI)
```

**Regra:** testes de integração passando antes de avançar para a próxima fase.

---

## Estratégia: Migração In-Place (sem rodar Express e NestJS em paralelo)

O projeto ainda não está em produção com múltiplos clientes ativos.
Rodar dois frameworks em paralelo duplica a superfície de manutenção sem benefício real.

1. Criar `src/main.ts` + `src/app.module.ts` enquanto `src/server.ts` ainda existe
2. Alterar `npm run dev` para apontar para `main.ts` quando o bootstrap estiver pronto
3. A cada fase, remover os arquivos Express equivalentes
4. Services e repositories são copiados **sem alteração de lógica** — só troca o import direto do `prisma` por injeção via construtor

---

## Mapeamento Express → NestJS

### AppError → HttpException

```typescript
// ANTES
throw new AppError(404, 'Cliente não encontrado')

// DEPOIS — alias específico quando disponível
throw new NotFoundException('Cliente não encontrado')
throw new ConflictException('Pedido já possui agendamento')
throw new BadRequestException('Pedido não possui serviços')

// Genérico quando necessário
throw new HttpException('mensagem', HttpStatus.CONFLICT)
```

Aliases disponíveis nativamente:
`NotFoundException`, `UnauthorizedException`, `ForbiddenException`,
`ConflictException`, `BadRequestException`, `UnprocessableEntityException`

### AllExceptionsFilter (substitui errorHandler.ts)

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      return res.status(exception.getStatus()).json({ message: exception.message });
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const map: Record<string, [number, string]> = {
        P2025: [404, 'Registro não encontrado'],
        P2002: [409, 'Já existe um registro com este valor único'],
        P2003: [409, 'Operação viola um relacionamento existente'],
      };
      const [status, message] = map[exception.code] ?? [500, 'Erro interno'];
      return res.status(status).json({ message });
    }

    if (exception instanceof ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', issues: exception.issues });
    }

    console.error(exception);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
```

### authMiddleware → JwtStrategy + JwtAuthGuard

`jwt.strategy.ts` — extrai e valida o payload:
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; empresaId: string; role: string }) {
    return { userId: payload.sub, empresaId: payload.empresaId, role: payload.role };
  }
}
```

`jwt-auth.guard.ts` — respeita `@Public()`:
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super() }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

Decorator `@CurrentUser()`:
```typescript
export const CurrentUser = createParamDecorator(
  (_, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user
);
```

### validate middleware → ZodValidationPipe + DTOs

```typescript
// create-cliente.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createClienteSchema = z.object({
  nome: z.string().min(1).max(120),
  telefone: z.string().min(8).max(20),
  email: z.string().email(),
});

export class CreateClienteDto extends createZodDto(createClienteSchema) {}
```

Controller usa o DTO — o pipe cuida da validação automaticamente:
```typescript
@Post()
create(@Body() dto: CreateClienteDto, @CurrentUser() user: UserPayload) {
  return this.clienteService.create(dto, user.empresaId);
}
```

Validação de UUID nos params:
```typescript
@Get(':id')
get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
  return this.clienteService.get(id, user.empresaId);
}
```

---

## Implementação: RBAC e Multitenancy

### Schema Prisma — novos campos

```prisma
enum Role {
  ADMIN
  GERENTE
  ATENDENTE
}

model Empresa {
  id           String        @id @default(uuid())
  nome         String
  slug         String        @unique
  ativo        Boolean       @default(true)
  createdAt    DateTime      @default(now()) @map("created_at")
  funcionarios Funcionario[]
  clientes     Cliente[]
  // ... demais relações

  @@map("empresas")
}

model Funcionario {
  // campos existentes...
  role      Role    @default(ATENDENTE)
  empresaId String  @map("empresa_id")
  empresa   Empresa @relation(fields: [empresaId], references: [id])
}
```

### Migration segura para adicionar empresaId (banco com dados existentes)

```bash
# 1. Adicionar como nullable
# 2. prisma migrate dev
# 3. Rodar script que popula empresaId com empresa padrão
# 4. Alterar para NOT NULL
# 5. prisma migrate dev

# NUNCA fazer steps 1 e 4 na mesma migration com dados existentes
```

### JWT com empresaId e role

```typescript
// auth.service.ts
const payload = { sub: f.id, empresaId: f.empresaId, role: f.role };
const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
```

### Repositories tenant-aware

```typescript
@Injectable()
export class ClienteRepository {
  constructor(private prisma: PrismaService) {}

  findAll(empresaId: string, page: number, limit: number) {
    return this.prisma.cliente.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findById(id: string, empresaId: string) {
    // Se o id existe mas pertence a outro tenant → retorna null → service lança 404
    return this.prisma.cliente.findUnique({ where: { id, empresaId } });
  }
}
```

### RolesGuard

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

Uso nos controllers:
```typescript
@Delete(':id')
@Roles(Role.ADMIN)
remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
  return this.funcionarioService.remove(id, user.empresaId);
}
```

Registro global em `AppModule`:
```typescript
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
]
```

### Refresh Token — tabela Prisma (MVP sem Redis)

```prisma
model RefreshToken {
  id            String      @id @default(uuid())
  funcionarioId String      @map("funcionario_id")
  token         String      @unique
  expiresAt     DateTime    @map("expires_at")
  createdAt     DateTime    @default(now()) @map("created_at")
  funcionario   Funcionario @relation(fields: [funcionarioId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}
```

---

## Como Fica o Módulo de Agendamento (referência)

O controller no padrão NestJS:
```typescript
@ApiTags('Agendamentos')
@ApiBearerAuth()
@Controller('agendamentos')
export class AgendamentoController {
  constructor(private readonly agendamentoService: AgendamentoService) {}

  @Get()
  list(@Query('data') data?: string, @CurrentUser() user: UserPayload) {
    return this.agendamentoService.list(user.empresaId, data);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.agendamentoService.get(id, user.empresaId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAgendamentoDto, @CurrentUser() user: UserPayload) {
    return this.agendamentoService.create(dto, user.empresaId);
  }

  @Patch(':id/cancelar')
  @Roles(Role.ADMIN, Role.GERENTE)
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.agendamentoService.cancel(id, user.empresaId);
  }

  @Patch(':id/concluir')
  conclude(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserPayload) {
    return this.agendamentoService.conclude(id, user.empresaId);
  }
}
```

O service do agendamento — **lógica idêntica ao atual**, só troca import direto por DI:
```typescript
@Injectable()
export class AgendamentoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAgendamentoDto, empresaId: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: data.pedidoId, empresaId }, // tenant-aware
      include: { servicos: { include: { servico: true } }, agendamento: true },
    });
    if (!pedido) throw new NotFoundException('Pedido não encontrado');

    // ... toda a lógica de validação IDÊNTICA ao service atual ...

    // A transaction continua existindo exatamente como está
    return this.prisma.$transaction(async (tx) => {
      // ... lógica preservada sem nenhuma alteração
    });
  }
}
```

---

## Adaptação dos Testes de Integração

Os testes atuais importam `{ app } from "../../app"` (Express).
Criar helper para o bootstrap NestJS:

```typescript
// __tests__/helpers/nest-app.ts
let app: INestApplication;

export async function getApp() {
  if (!app) {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  }
  return app;
}
```

Nos testes, trocar:
```typescript
// ANTES
import { app } from '../../app';

// DEPOIS
const app = await getApp();
```

O `cleanDb` e o `getToken` permanecem idênticos — apontam para o banco de teste e fazem requests HTTP.

---

## Swagger Automático — Configuração

`patchNestJsSwagger()` deve ser **primeira linha** do `main.ts`:

```typescript
// main.ts
import { patchNestJsSwagger } from 'nestjs-zod';
patchNestJsSwagger(); // antes de qualquer import de módulo com DTOs

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('ERP Gestão Empresarial')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc);

  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
```

---

## Estimativa de Esforço

| Fase | Conteúdo | Estimativa |
|---|---|---|
| 0 | Setup NestJS, tsconfig, `main.ts` + `AppModule` vazio, `npm run dev` funcionando | 2h |
| 1 | PrismaModule + PrismaService + ConfigModule com validação Zod do `.env` | 2h |
| 2 | AuthModule: JwtStrategy, JwtAuthGuard, RolesGuard, decorators, AllExceptionsFilter, ZodValidationPipe, `/auth/login` funcionando, testes passando | 6h |
| 3 | ClienteModule: controller + service + repository com DI, testes passando | 3h |
| 4 | ServicoModule + SalaModule | 3h |
| 5 | FuncionarioModule: sub-recurso `/servicos`, agendamentos futuros | 4h |
| 6 | PedidoModule: dependências cruzadas | 3h |
| 7 | AgendamentoModule: preservação exata da transaction, testes de conflito | 5h |
| 8 | Migration Prisma: Empresa + empresaId em todos os modelos + seed + filtro tenant | 8h |
| 9 | RBAC: `role` no Funcionario, guards nos endpoints, testes de autorização | 4h |
| 10 | Throttler, Helmet, paginação, LoggingInterceptor (pino), Swagger automático | 6h |
| 11 | Refresh token, limpeza (remover Express, docker-compose, CI) | 4h |
| Buffer | Bugs inesperados, ajuste de testes | 4h |
| **Total** | | **~54h (~7 dias úteis)** |

---

## Riscos e Mitigações

| Risco | Prob. | Mitigação |
|---|---|---|
| Testes quebram na troca de `import { app }` | Alta | Helper `nest-app.ts` com `NestFactory` — mesma superfície HTTP |
| Lógica transacional do agendamento quebra silenciosamente | Média | Testes de integração cobrem conflito de horário e especialidade — se passarem, transaction está íntegra |
| `strictPropertyInitialization` conflita com DI | Alta | `strictPropertyInitialization: false` no tsconfig (sem perda de segurança) |
| Multitenancy introduzida junto com módulos cria risco duplo | Alta | Migrar módulos (Fases 3-7) antes de introduzir multitenancy (Fase 8) |
| `nestjs-zod` + Swagger gerando docs incorretas | Baixa | `patchNestJsSwagger()` como primeira linha do `main.ts` |
| Refresh token não sobrevive a restart se em memória | Certeza | Tabela `RefreshToken` no Prisma desde o início (Redis depois) |
| Controllers verbosos com decorators Swagger | Certa | Usar só `@ApiTags()` e `@ApiBearerAuth()` inicialmente; Swagger infere DTOs automaticamente |
