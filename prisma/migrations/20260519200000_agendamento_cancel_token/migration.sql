-- AlterTable
ALTER TABLE "agendamentos" ADD COLUMN "cancel_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "agendamentos_cancel_token_key" ON "agendamentos"("cancel_token");
