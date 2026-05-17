-- Fase 2: Multi-empresa e onboarding
-- Adiciona superAdmin e emailVerificado ao funcionario
-- Cria modelos ConviteToken e EmailVerificationToken

ALTER TABLE "funcionarios"
  ADD COLUMN "super_admin"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "email_verificado"  BOOLEAN NOT NULL DEFAULT true;

-- Tabela de convites (substitui temp password no fluxo de convite)
CREATE TABLE "convite_tokens" (
    "id"         TEXT         NOT NULL,
    "token"      TEXT         NOT NULL,
    "email"      TEXT         NOT NULL,
    "nome"       TEXT,
    "empresa_id" TEXT         NOT NULL,
    "papel"      "Role"       NOT NULL DEFAULT 'ATENDENTE',
    "used_at"    TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convite_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "convite_tokens_token_key"  ON "convite_tokens"("token");
CREATE        INDEX "convite_tokens_email_idx"  ON "convite_tokens"("email");

ALTER TABLE "convite_tokens"
    ADD CONSTRAINT "convite_tokens_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Tabela de tokens de verificação de email (self-registration)
CREATE TABLE "email_verification_tokens" (
    "id"             TEXT         NOT NULL,
    "token"          TEXT         NOT NULL,
    "funcionario_id" TEXT         NOT NULL,
    "used_at"        TIMESTAMP(3),
    "expires_at"     TIMESTAMP(3) NOT NULL,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

ALTER TABLE "email_verification_tokens"
    ADD CONSTRAINT "email_verification_tokens_funcionario_id_fkey"
    FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
