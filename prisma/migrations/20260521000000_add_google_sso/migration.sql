-- AlterTable
ALTER TABLE "funcionarios" ADD COLUMN "google_id" TEXT,
ALTER COLUMN "senha" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "funcionarios_google_id_key" ON "funcionarios"("google_id");
