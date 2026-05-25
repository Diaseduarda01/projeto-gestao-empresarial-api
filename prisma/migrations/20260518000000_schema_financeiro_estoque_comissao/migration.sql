-- Fase 3: Schema Financeiro, Estoque e Comissão
-- Migração do enum Plano (renomear valores) + novos domínios

-- 1. Migrar enum Plano (RENAME VALUE requer PG 10+; dados existentes são atualizados automaticamente)
ALTER TYPE "Plano" RENAME VALUE 'BASICO'       TO 'BASIC';
ALTER TYPE "Plano" RENAME VALUE 'PROFISSIONAL'  TO 'BRONZE';
ALTER TYPE "Plano" RENAME VALUE 'ENTERPRISE'    TO 'PLATINUM';
ALTER TYPE "Plano" ADD VALUE 'GOLD';

-- Atualizar default da coluna empresas.plano
ALTER TABLE "empresas" ALTER COLUMN "plano" SET DEFAULT 'BASIC';

-- 2. Novos enums

CREATE TYPE "FormaPagamento" AS ENUM (
  'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'CREDITO_LOJA', 'ABACATE_PAY'
);

CREATE TYPE "PagamentoStatus" AS ENUM (
  'PENDENTE', 'CONFIRMADO', 'CANCELADO', 'EXPIRADO'
);

CREATE TYPE "MovimentoTipo" AS ENUM (
  'ENTRADA', 'SAIDA', 'AJUSTE'
);

-- 3. Tabela pagamentos

CREATE TABLE "pagamentos" (
    "id"              TEXT              NOT NULL,
    "empresa_id"      TEXT              NOT NULL,
    "agendamento_id"  TEXT,
    "cliente_id"      TEXT              NOT NULL,
    "valor"           DECIMAL(10,2)     NOT NULL,
    "desconto"        DECIMAL(10,2),
    "forma_pagamento" "FormaPagamento"  NOT NULL,
    "status"          "PagamentoStatus" NOT NULL DEFAULT 'PENDENTE',
    "pago_em"         TIMESTAMP(3),
    "observacoes"     TEXT,
    "criado_em"       TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em"   TIMESTAMP(3)      NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pagamentos_agendamento_id_key"       ON "pagamentos"("agendamento_id");
CREATE        INDEX "pagamentos_empresa_id_criado_em_idx" ON "pagamentos"("empresa_id", "criado_em");
CREATE        INDEX "pagamentos_status_idx"               ON "pagamentos"("status");

ALTER TABLE "pagamentos"
    ADD CONSTRAINT "pagamentos_empresa_id_fkey"
        FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "pagamentos_agendamento_id_fkey"
        FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "pagamentos_cliente_id_fkey"
        FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Tabela produtos

CREATE TABLE "produtos" (
    "id"                    TEXT          NOT NULL,
    "empresa_id"            TEXT          NOT NULL,
    "nome"                  TEXT          NOT NULL,
    "descricao"             TEXT,
    "unidade"               TEXT          NOT NULL DEFAULT 'un',
    "estoque_atual"         DECIMAL(10,3) NOT NULL DEFAULT 0,
    "estoque_minimo_alerta" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "preco"                 DECIMAL(10,2),
    "ativo"                 BOOLEAN       NOT NULL DEFAULT true,
    "criado_em"             TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em"         TIMESTAMP(3)  NOT NULL,
    "deleted_at"            TIMESTAMP(3),

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "produtos_empresa_id_idx"  ON "produtos"("empresa_id");
CREATE INDEX "produtos_deleted_at_idx"  ON "produtos"("deleted_at");

ALTER TABLE "produtos"
    ADD CONSTRAINT "produtos_empresa_id_fkey"
        FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Tabela servico_produtos (insumos por serviço)

CREATE TABLE "servico_produtos" (
    "servico_id"  TEXT          NOT NULL,
    "produto_id"  TEXT          NOT NULL,
    "quantidade"  DECIMAL(10,3) NOT NULL,

    CONSTRAINT "servico_produtos_pkey" PRIMARY KEY ("servico_id", "produto_id")
);

ALTER TABLE "servico_produtos"
    ADD CONSTRAINT "servico_produtos_servico_id_fkey"
        FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "servico_produtos_produto_id_fkey"
        FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Tabela movimentos_estoque

CREATE TABLE "movimentos_estoque" (
    "id"              TEXT            NOT NULL,
    "produto_id"      TEXT            NOT NULL,
    "empresa_id"      TEXT            NOT NULL,
    "tipo"            "MovimentoTipo" NOT NULL,
    "quantidade"      DECIMAL(10,3)   NOT NULL,
    "referencia"      TEXT,
    "agendamento_id"  TEXT,
    "funcionario_id"  TEXT,
    "criado_em"       TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_estoque_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "movimentos_estoque_produto_id_criado_em_idx" ON "movimentos_estoque"("produto_id", "criado_em");
CREATE INDEX "movimentos_estoque_agendamento_id_idx"        ON "movimentos_estoque"("agendamento_id");

ALTER TABLE "movimentos_estoque"
    ADD CONSTRAINT "movimentos_estoque_produto_id_fkey"
        FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "movimentos_estoque_empresa_id_fkey"
        FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "movimentos_estoque_agendamento_id_fkey"
        FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "movimentos_estoque_funcionario_id_fkey"
        FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Tabela comissoes_funcionarios

CREATE TABLE "comissoes_funcionarios" (
    "id"              TEXT         NOT NULL,
    "funcionario_id"  TEXT         NOT NULL,
    "empresa_id"      TEXT         NOT NULL,
    "servico_id"      TEXT,
    "percentual"      DECIMAL(5,2) NOT NULL,
    "criado_em"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comissoes_funcionarios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "comissoes_func_unique_idx"
    ON "comissoes_funcionarios"("funcionario_id", "empresa_id", "servico_id");
CREATE INDEX "comissoes_func_empresa_func_idx"
    ON "comissoes_funcionarios"("empresa_id", "funcionario_id");

ALTER TABLE "comissoes_funcionarios"
    ADD CONSTRAINT "comissoes_funcionarios_funcionario_id_fkey"
        FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "comissoes_funcionarios_empresa_id_fkey"
        FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "comissoes_funcionarios_servico_id_fkey"
        FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
