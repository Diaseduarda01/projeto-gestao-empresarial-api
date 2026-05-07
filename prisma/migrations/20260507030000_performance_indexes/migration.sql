-- Add updatedAt to servicos
ALTER TABLE "servicos" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt to salas
ALTER TABLE "salas" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt to pedidos
ALTER TABLE "pedidos" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Performance indexes
CREATE INDEX "agendamentos_data_idx" ON "agendamentos"("data");
CREATE INDEX "pedidos_status_idx" ON "pedidos"("status");
CREATE INDEX "pedidos_cliente_id_idx" ON "pedidos"("cliente_id");
CREATE INDEX "clientes_nome_idx" ON "clientes"("nome");
