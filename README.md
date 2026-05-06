# Gestão Empresarial — API

API REST para gestão de clientes, funcionários, serviços, salas, pedidos e agendamentos.

## Regras de negócio

```
CLIENTE faz PEDIDO
PEDIDO tem SERVIÇO
PEDIDO tem AGENDAMENTO
AGENDAMENTO tem FUNCIONÁRIO
AGENDAMENTO tem SALA
FUNCIONÁRIO faz SERVIÇO (especialidade)
```

Um funcionário só pode ser atribuído a um agendamento se tiver especialidade em **todos** os serviços do pedido. Conflitos de horário (mesmo funcionário ou mesma sala) são verificados atomicamente dentro de uma transaction.

## Stack

- **Runtime:** Node.js 20 + TypeScript 5.6
- **Framework:** NestJS 11
- **ORM:** Prisma 5.22 (migrations + client gen)
- **Banco:** PostgreSQL (UUIDs como PKs)
- **Auth:** JWT + bcrypt (Passport + @nestjs/jwt)
- **Validação:** Zod + nestjs-zod (ZodValidationPipe global)
- **Docs:** Swagger UI em `/docs`
- **Docker:** Dockerfile disponível (porta 3333)

---

## Início rápido com Docker

```bash
cp .env.example .env          # ajuste JWT_SECRET se necessário
docker compose up -d
docker compose exec api npx tsx prisma/seed.ts   # cria admin@admin.com
```

API disponível em `http://localhost:3333` — documentação em `http://localhost:3333/docs`.

---

## Desenvolvimento local

### Pré-requisitos

- Node.js 20+
- PostgreSQL 14+

### Setup

```bash
npm install
cp .env.example .env          # edite DATABASE_URL e JWT_SECRET

npx prisma migrate dev        # cria as tabelas
npm run seed                  # cria usuário admin (admin@admin.com / admin123)
npm run dev                   # inicia em http://localhost:3333
```

---

## Variáveis de ambiente

| Variável       | Descrição                        | Padrão                    |
|----------------|----------------------------------|---------------------------|
| `DATABASE_URL` | Connection string do PostgreSQL  | (obrigatório)             |
| `JWT_SECRET`   | Segredo para assinar o JWT       | (obrigatório)             |
| `PORT`         | Porta da aplicação               | `3333`                    |

---

## Scripts disponíveis

| Comando          | Descrição                                        |
|------------------|--------------------------------------------------|
| `npm run dev`    | Inicia com hot reload (nodemon + ts-node)        |
| `npm run build`  | Compila TypeScript para `dist/`                  |
| `npm start`      | Inicia a build compilada (`dist/main.js`)        |
| `npm run seed`   | Cria o usuário admin padrão                      |

---

## Endpoints principais

Todos os endpoints (exceto `POST /auth/login` e `GET /health`) exigem:
```
Authorization: Bearer <token>
```

### Auth
| Método | Rota          | Descrição          |
|--------|---------------|--------------------|
| POST   | /auth/login   | Login, retorna JWT |

### Clientes
| Método | Rota              | Descrição        |
|--------|-------------------|------------------|
| GET    | /clientes         | Listar           |
| GET    | /clientes/:id     | Buscar           |
| POST   | /clientes         | Criar            |
| PUT    | /clientes/:id     | Atualizar        |
| DELETE | /clientes/:id     | Remover          |

### Funcionários
| Método | Rota                              | Descrição               |
|--------|-----------------------------------|-------------------------|
| GET    | /funcionarios                     | Listar                  |
| GET    | /funcionarios/:id                 | Buscar                  |
| POST   | /funcionarios                     | Criar                   |
| PUT    | /funcionarios/:id                 | Atualizar               |
| DELETE | /funcionarios/:id                 | Remover                 |
| GET    | /funcionarios/:id/servicos        | Listar especialidades   |
| POST   | /funcionarios/:id/servicos        | Adicionar especialidade |
| DELETE | /funcionarios/:id/servicos/:sid   | Remover especialidade   |

### Serviços
| Método | Rota          | Descrição |
|--------|---------------|-----------|
| GET    | /servicos     | Listar    |
| GET    | /servicos/:id | Buscar    |
| POST   | /servicos     | Criar     |
| PUT    | /servicos/:id | Atualizar |
| DELETE | /servicos/:id | Remover   |

### Salas
| Método | Rota       | Descrição |
|--------|------------|-----------|
| GET    | /salas     | Listar    |
| GET    | /salas/:id | Buscar    |
| POST   | /salas     | Criar     |
| PUT    | /salas/:id | Atualizar |
| DELETE | /salas/:id | Remover   |

### Pedidos
| Método | Rota                    | Descrição                          |
|--------|-------------------------|------------------------------------|
| GET    | /pedidos                | Listar com relações                |
| GET    | /pedidos/:id            | Buscar com relações                |
| POST   | /pedidos                | Criar `{ clienteId, servicoIds[] }`|
| POST   | /pedidos/:id/servicos   | Adicionar serviços (só se ABERTO)  |
| PATCH  | /pedidos/:id/cancelar   | Cancelar pedido                    |

### Agendamentos
| Método | Rota                       | Descrição                                           |
|--------|----------------------------|-----------------------------------------------------|
| GET    | /agendamentos              | Listar (`?data=YYYY-MM-DD`)                         |
| GET    | /agendamentos/:id          | Buscar com relações                                 |
| POST   | /agendamentos              | Criar `{ pedidoId, funcionarioId, salaId, data, horaInicio }` |
| PATCH  | /agendamentos/:id/cancelar | Cancelar (atualiza pedido também)                   |
| PATCH  | /agendamentos/:id/concluir | Concluir (atualiza pedido também)                   |

### Utilitários
| Método | Rota    | Descrição          |
|--------|---------|--------------------|
| GET    | /health | Health check       |
| GET    | /docs   | Swagger UI         |

---

## Fluxo típico

```
1. POST /auth/login → obtém token

2. POST /funcionarios → cria funcionário
3. POST /servicos → cria serviço
4. POST /funcionarios/:id/servicos → associa serviço ao funcionário

5. POST /salas → cria sala
6. POST /clientes → cria cliente

7. POST /pedidos → cria pedido com serviços
8. POST /agendamentos → agenda: valida especialidade + conflito de horário

9. PATCH /agendamentos/:id/concluir → finaliza atendimento
```
