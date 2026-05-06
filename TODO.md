# TODO — ERP Gestão Empresarial (API)

Análise técnica de lacunas para tornar a API um ERP robusto, seguro, escalável e performático
para múltiplas empresas (estúdios de tatuagem, clínicas de estética, barbearias, salões).

---

## 🔴 PRIORIDADE 1 — Segurança

- [ ] Restringir CORS por origem (`cors({ origin: process.env.ALLOWED_ORIGINS })`)
- [ ] Adicionar rate limiting no login (`express-rate-limit`) — máximo de tentativas por IP
- [ ] Adicionar `helmet` para headers de segurança HTTP (CSP, HSTS, X-Frame-Options)
- [ ] Remover fallback inseguro do `JWT_SECRET` (`?? "dev-secret"` em `config/env.ts`)
- [ ] Implementar refresh token (short-lived access token + long-lived refresh token)
- [ ] Implementar blacklist de tokens (Redis) para logout e revogação imediata
- [ ] Implementar RBAC — papéis: `ADMIN`, `GERENTE`, `ATENDENTE` no modelo `Funcionario`
- [ ] Aplicar guards de permissão por rota (ex: só ADMIN pode deletar funcionários)
- [ ] Validar formato UUID nos params de rota antes de consultar o banco
- [ ] Verificar se o funcionário ainda existe ao validar o JWT no `authMiddleware`
- [ ] Implementar recuperação de senha por email (link com token temporário)

---

## 🔴 PRIORIDADE 2 — Multitenancy (obrigatório para ERP SaaS)

- [ ] Criar modelo `Empresa` no schema Prisma (`id, nome, slug, plano, ativo, createdAt`)
- [ ] Adicionar `empresaId` em todos os modelos: `Cliente`, `Funcionario`, `Servico`, `Sala`, `Pedido`, `Agendamento`
- [ ] Vincular `Funcionario` a uma `Empresa` (relação N:M para suportar funcionário em múltiplas filiais)
- [ ] Injetar `empresaId` no JWT e no `AuthRequest` via `authMiddleware`
- [ ] Filtrar todos os `findMany` / `findUnique` por `empresaId` do usuário autenticado
- [ ] Criar rota de onboarding de nova empresa (`POST /empresas`)
- [ ] Criar rota de convite de funcionário por email
- [ ] Criar seed por empresa (não apenas o admin global)

---

## 🔴 PRIORIDADE 3 — Performance e escalabilidade

- [ ] Adicionar paginação em todas as listagens (`?page=1&limit=20` com `take`/`skip` no Prisma)
- [ ] Configurar `connection_limit` no `PrismaClient` (`datasources.db.url` com `connection_limit=10`)
- [ ] Adicionar middleware de compressão HTTP (`compression` do npm)
- [ ] Criar índice em `agendamentos.data` no schema Prisma
- [ ] Criar índice em `pedidos.status` e `pedidos.clienteId`
- [ ] Criar índice em `clientes.nome` para busca textual
- [ ] Adicionar `updatedAt` nos modelos `Servico`, `Sala`, `Pedido`
- [ ] Configurar PM2 ou cluster mode para aproveitar múltiplos núcleos de CPU
- [ ] Implementar cache com Redis para dados estáticos (lista de serviços, salas)
- [ ] Adicionar `ETag` / `Cache-Control` nas respostas de listagem

---

## 🟡 PRIORIDADE 4 — Observabilidade e operação

- [ ] Implementar logs estruturados com `pino` ou `winston` (nível, timestamp, requestId, userId)
- [ ] Criar middleware que injeta `requestId` único em cada requisição (header `X-Request-Id`)
- [ ] Logar todas as requisições (método, rota, status, duração, userId)
- [ ] Atualizar `/health` para verificar a conexão com o banco (`prisma.$queryRaw('SELECT 1')`)
- [ ] Implementar `GET /health/ready` (banco ok) e `GET /health/live` (processo ok)
- [ ] Criar tabela de auditoria (`AuditLog`) — registra quem fez o quê em qual entidade
- [ ] Disparar evento de auditoria nas operações críticas: delete, update de status, criação de agendamento
- [ ] Adicionar variável de ambiente `NODE_ENV` com validação e comportamento distinto em produção

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
