-- Soft delete: adiciona deleted_at em clientes, servicos e salas
-- Registros com deleted_at != NULL são tratados como excluídos logicamente

ALTER TABLE "clientes" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "servicos" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "salas"    ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "clientes_deleted_at_idx" ON "clientes"("deleted_at");
CREATE INDEX "servicos_deleted_at_idx" ON "servicos"("deleted_at");
CREATE INDEX "salas_deleted_at_idx"    ON "salas"("deleted_at");
