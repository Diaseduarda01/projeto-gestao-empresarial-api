# TODO — ERP Gestão Empresarial (API)

Análise técnica de lacunas para tornar a API um ERP robusto, seguro, escalável e performático
para múltiplas empresas (estúdios de tatuagem, clínicas de estética, barbearias, salões).

---

## 🔴 PRIORIDADE 1 — Segurança

- [x] Restringir CORS por origem (`ALLOWED_ORIGINS` no env — restringe em prod, avisa em dev)
- [x] Adicionar rate limiting no login (`@nestjs/throttler` — 5 tentativas/min no login, 3 no recuperar-senha)
- [x] Adicionar `helmet` para headers de segurança HTTP (CSP, HSTS, X-Frame-Options)
- [x] Remover fallback inseguro do `JWT_SECRET` (`?? "dev-secret"` removido de `env.ts` e `jwt.strategy.ts`)
- [x] Implementar refresh token (access token 15min + refresh token UUID em DB com 7 dias — `POST /auth/refresh`)
- [x] Implementar blacklist de tokens (DB-based JTI blacklist — `BlacklistedToken` table, `POST /auth/logout`)
- [x] Implementar RBAC — papéis: `ADMIN`, `GERENTE`, `ATENDENTE` no modelo `Funcionario` (enum `Role`)
- [x] Aplicar guards de permissão por rota (`RolesGuard` + `@Roles()` — ex: só `ADMIN` pode deletar funcionário)
- [x] Validar formato UUID nos params de rota antes de consultar o banco (`ParseUUIDPipe` já estava em todos controllers)
- [x] Verificar se o funcionário ainda existe ao validar o JWT (`JwtStrategy.validate()` consulta DB)
- [x] Implementar recuperação de senha por email (link com token temporário — `POST /auth/recuperar-senha` + `POST /auth/redefinir-senha`)

---

## 🔴 PRIORIDADE 2 — Multitenancy (obrigatório para ERP SaaS)

- [x] Criar modelo `Empresa` no schema Prisma (`id, nome, slug, plano, ativo, createdAt`)
- [x] Adicionar `empresaId` em todos os modelos: `Cliente`, `Funcionario`, `Servico`, `Sala`, `Pedido`, `Agendamento`
- [x] Vincular `Funcionario` a uma `Empresa` (relação N:M via `FuncionarioEmpresa` — suporta múltiplas filiais)
- [x] Injetar `empresaId` no JWT e no `UserPayload` via `@CurrentUser()` decorator
- [x] Filtrar todos os `findMany` / `findUnique` por `empresaId` do usuário autenticado
- [x] Criar rota de onboarding de nova empresa (`POST /empresas`)
- [x] Criar rota de convite de funcionário por email (`POST /empresas/minha/convidar-funcionario`)
- [x] Criar seed por empresa (seed atualizado — cria Empresa Padrão + admin vinculado via FuncionarioEmpresa)

---

## 🔴 PRIORIDADE 3 — Performance e escalabilidade

- [x] Adicionar paginação em todas as listagens (`?page=1&limit=20` — retorna `{ data, total, page, limit }`)
- [x] Configurar `connection_limit` no `PrismaClient` (via `DB_CONNECTION_LIMIT` env — default 10, appended to DATABASE_URL)
- [x] Adicionar middleware de compressão HTTP (`compression` do npm — ativo em `main.ts`)
- [x] Criar índice em `agendamentos.data` no schema Prisma
- [x] Criar índice em `pedidos.status` e `pedidos.clienteId`
- [x] Criar índice em `clientes.nome` para busca textual
- [x] Adicionar `updatedAt` nos modelos `Servico`, `Sala`, `Pedido`
- [x] Configurar PM2 cluster mode (`ecosystem.config.js` com `instances: 'max'`, `exec_mode: 'cluster'`)
- [x] Implementar cache in-memory para dados estáticos (servicos e salas — `@nestjs/cache-manager`, TTL 60s, pronto para Redis)
- [x] Adicionar `ETag` / `Cache-Control` nas respostas de listagem (`ETagInterceptor` global — suporta 304 Not Modified)

---

## 🟡 PRIORIDADE 4 — Observabilidade e operação

- [x] Implementar logs estruturados com `pino` ou `winston` (nível, timestamp, requestId, userId)
- [x] Criar middleware que injeta `requestId` único em cada requisição (header `X-Request-Id`)
- [x] Logar todas as requisições (método, rota, status, duração, userId)
- [x] Atualizar `/health` para verificar a conexão com o banco (`prisma.$queryRaw('SELECT 1')`)
- [x] Implementar `GET /health/ready` (banco ok) e `GET /health/live` (processo ok)
- [x] Criar tabela de auditoria (`AuditLog`) — registra quem fez o quê em qual entidade
- [x] Disparar evento de auditoria nas operações críticas: delete, update de status, criação de agendamento
- [x] Adicionar variável de ambiente `NODE_ENV` com validação e comportamento distinto em produção

---

## 🟡 PRIORIDADE 5 — Módulos de negócio faltando

### Financeiro
- [ ] Criar modelo `Pagamento` (`id, agendamentoId, valor, formaPagamento, pago, createdAt`)
- [ ] Enum `FormaPagamento`: `DINHEIRO`, `CARTAO_CREDITO`, `CARTAO_DEBITO`, `PIX`, `TRANSFERENCIA`
- [ ] `POST /agendamentos/:id/pagamento` — registrar pagamento
- [ ] `GET /caixa?data=YYYY-MM-DD` — resumo de receitas do dia
- [ ] Comissão de funcionário: percentual configurável por funcionário ou serviço
- [ ] `GET /relatorios/faturamento?inicio=&fim=` — faturamento por período

### Disponibilidade e calendário
- [ ] Criar modelo `HorarioTrabalho` (`funcionarioId, diaSemana, horaInicio, horaFim`)
- [ ] Criar modelo `Folga` / `BloqueioAgenda` (`funcionarioId, data, motivo`)
- [ ] Validar no `agendamento.service.ts` se o funcionário trabalha no dia/horário solicitado
- [ ] `GET /funcionarios/:id/disponibilidade?data=YYYY-MM-DD` — horários livres do dia
- [ ] Criar modelo `HorarioFuncionamento` da empresa (por dia da semana)
- [ ] Bloquear agendamentos fora do horário de funcionamento da empresa

### Ficha do cliente
- [ ] Adicionar campos opcionais em `Cliente`: `dataNascimento`, `cpf`, `observacoes`, `alergias`
- [ ] `GET /clientes/:id/historico` — todos os pedidos e agendamentos do cliente
- [ ] `GET /clientes/:id/aniversariantes` — listagem de clientes aniversariantes do mês

### Reagendamento
- [ ] `PATCH /agendamentos/:id/reagendar` — altera data/hora/sala/funcionário mantendo o pedido
- [ ] Registrar histórico de reagendamentos em tabela `AgendamentoHistorico`

### Notificações
- [ ] Integrar serviço de email (Nodemailer + SMTP ou Resend)
- [ ] Enviar email de confirmação ao criar agendamento
- [ ] Enviar email de lembrete 24h antes do agendamento (job assíncrono)
- [ ] Enviar email de cancelamento ao cancelar agendamento
- [ ] Criar fila de jobs assíncronos (BullMQ + Redis) para envio de notificações

### Política de cancelamento
- [ ] Criar configuração `PoliticaCancelamento` por empresa (prazo mínimo em horas, multa %)
- [ ] Validar prazo de antecedência mínima ao cancelar agendamento
- [ ] Registrar motivo de cancelamento como campo opcional

### Lista de espera
- [ ] Criar modelo `ListaEspera` (`clienteId, servicoId, funcionarioId?, dataDesejada`)
- [ ] Notificar próximo da fila quando um agendamento for cancelado

---

## 🟡 PRIORIDADE 6 — Busca, filtros e relatórios

- [ ] `GET /clientes?busca=nome_ou_email` — busca textual em clientes
- [ ] `GET /agendamentos?funcionarioId=&status=&inicio=&fim=` — filtros combinados
- [ ] `GET /pedidos?status=&clienteId=` — filtros em pedidos
- [ ] `GET /relatorios/agendamentos` — total por status, por funcionário, por período
- [ ] `GET /relatorios/ocupacao` — taxa de ocupação de salas e funcionários
- [ ] `GET /relatorios/servicos` — serviços mais realizados, receita por serviço

---

## 🟢 PRIORIDADE 7 — Qualidade e manutenibilidade

### Arquitetura
- [ ] Padronizar todos os módulos com camadas: `controller` / `service` / `repository` (igual ao módulo `cliente/`)
- [ ] Criar `repository` para `agendamento`, `funcionario`, `pedido`, `servico`, `sala`
- [ ] Mover schemas Zod para arquivos `*.schema.ts` separados dos services

### Testes
- [ ] Escrever testes de integração para o fluxo completo de agendamento (conflito de horário, especialidade, transaction)
- [ ] Escrever testes de integração para criação de pedido (cliente inexistente, serviço inexistente)
- [ ] Escrever testes unitários para `agendamento.service` (cálculo de `horaFim`, validações)
- [ ] Configurar banco de dados de teste isolado (`.env.test`)
- [ ] Adicionar cobertura mínima de 70% como gate no CI

### Banco de dados
- [ ] Adicionar soft delete nos modelos principais (`deletedAt DateTime?`)
- [ ] Filtrar `where: { deletedAt: null }` em todos os `findMany`
- [ ] Revisar timezone do agendamento — usar `DateTime @db.Timestamptz` em vez de `Timestamp`
- [ ] Adicionar constraint de `horaFim > horaInicio` no banco

### API
- [ ] Criar middleware de validação de params (`validateParams`) para UUIDs no path
- [ ] Padronizar respostas de lista com envelope: `{ data: [], total, page, limit }`
- [ ] Retornar `Location` header no `201 Created` apontando para o recurso criado
- [ ] Adicionar versioning de API (`/v1/...`) para permitir evolução sem breaking changes

### Documentação
- [ ] Migrar Swagger para geração automática via decorators ou `zod-to-openapi`
- [ ] Adicionar exemplos de request/response em todos os endpoints no Swagger
- [ ] Documentar códigos de erro padronizados

---

## 🟢 PRIORIDADE 8 — Infraestrutura e deploy

- [ ] Criar `docker-compose.prod.yml` com variáveis de ambiente seguras (sem defaults)
- [ ] Adicionar `nginx` como reverse proxy no docker-compose (com SSL termination)
- [ ] Configurar variáveis de ambiente obrigatórias com validação no startup (falhar rápido se `JWT_SECRET` ausente)
- [ ] Criar pipeline CI/CD básico (GitHub Actions: lint → test → build → deploy)
- [ ] Adicionar linting com `eslint` + `prettier` configurados
- [ ] Configurar backup automático do Postgres
- [ ] Implementar migrations automáticas no startup do container (`prisma migrate deploy`)
- [ ] Adicionar `CHANGELOG.md` e versionamento semântico

---

## Resumo por esforço estimado

| Prioridade | Área | Esforço |
|---|---|---|
| 1 | Segurança básica | ~2 dias |
| 2 | Multitenancy | ~5 dias |
| 3 | Performance | ~2 dias |
| 4 | Observabilidade | ~1 dia |
| 5 | Módulos de negócio | ~10 dias |
| 6 | Busca e relatórios | ~3 dias |
| 7 | Qualidade e testes | ~4 dias |
| 8 | Infraestrutura | ~2 dias |

**Total estimado: ~29 dias de desenvolvimento solo** (ou ~15 dias em dupla)
