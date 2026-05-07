-- CreateEnum
CREATE TYPE "Plano" AS ENUM ('BASICO', 'PROFISSIONAL', 'ENTERPRISE');

-- CreateTable empresas
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plano" "Plano" NOT NULL DEFAULT 'BASICO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "empresas_slug_key" ON "empresas"("slug");

-- Insert default empresa for existing data migration
INSERT INTO "empresas" ("id", "nome", "slug")
VALUES ('00000000-0000-0000-0000-000000000001', 'Empresa Padrão', 'empresa-padrao');

-- CreateTable funcionario_empresas (papel migrates from funcionarios)
CREATE TABLE "funcionario_empresas" (
    "funcionario_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "papel" "Role" NOT NULL DEFAULT 'ATENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "funcionario_empresas_pkey" PRIMARY KEY ("funcionario_id", "empresa_id")
);

-- Migrate existing funcionarios.papel → funcionario_empresas
INSERT INTO "funcionario_empresas" ("funcionario_id", "empresa_id", "papel")
SELECT "id", '00000000-0000-0000-0000-000000000001', "papel"
FROM "funcionarios";

-- Drop papel from funcionarios
ALTER TABLE "funcionarios" DROP COLUMN "papel";

-- Add empresa_id to clientes (nullable → populate → NOT NULL → unique constraint)
ALTER TABLE "clientes" ADD COLUMN "empresa_id" TEXT;
UPDATE "clientes" SET "empresa_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "clientes" ALTER COLUMN "empresa_id" SET NOT NULL;
-- Drop old unique constraint on email and add compound one
ALTER TABLE "clientes" DROP CONSTRAINT IF EXISTS "clientes_email_key";
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_email_empresa_id_key" UNIQUE ("email", "empresa_id");

-- Add empresa_id to servicos
ALTER TABLE "servicos" ADD COLUMN "empresa_id" TEXT;
UPDATE "servicos" SET "empresa_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "servicos" ALTER COLUMN "empresa_id" SET NOT NULL;

-- Add empresa_id to salas
ALTER TABLE "salas" ADD COLUMN "empresa_id" TEXT;
UPDATE "salas" SET "empresa_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "salas" ALTER COLUMN "empresa_id" SET NOT NULL;

-- Add empresa_id to pedidos
ALTER TABLE "pedidos" ADD COLUMN "empresa_id" TEXT;
UPDATE "pedidos" SET "empresa_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "pedidos" ALTER COLUMN "empresa_id" SET NOT NULL;

-- Add empresa_id to agendamentos
ALTER TABLE "agendamentos" ADD COLUMN "empresa_id" TEXT;
UPDATE "agendamentos" SET "empresa_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "agendamentos" ALTER COLUMN "empresa_id" SET NOT NULL;

-- Add empresa_id to refresh_tokens
ALTER TABLE "refresh_tokens" ADD COLUMN "empresa_id" TEXT;
UPDATE "refresh_tokens" SET "empresa_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "refresh_tokens" ALTER COLUMN "empresa_id" SET NOT NULL;

-- AddForeignKey constraints
ALTER TABLE "funcionario_empresas" ADD CONSTRAINT "funcionario_empresas_funcionario_id_fkey"
    FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "funcionario_empresas" ADD CONSTRAINT "funcionario_empresas_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "salas" ADD CONSTRAINT "salas_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
