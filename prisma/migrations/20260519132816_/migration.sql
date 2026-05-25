-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "alergias" TEXT,
ADD COLUMN     "cpf" VARCHAR(14),
ADD COLUMN     "data_nascimento" DATE,
ADD COLUMN     "observacoes" TEXT;

-- CreateTable
CREATE TABLE "agendamentos_historico" (
    "id" TEXT NOT NULL,
    "agendamento_id" TEXT NOT NULL,
    "funcionario_id" TEXT NOT NULL,
    "sala_id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "hora_inicio" TIMESTAMPTZ(6) NOT NULL,
    "hora_fim" TIMESTAMPTZ(6) NOT NULL,
    "motivo_reagendamento" TEXT,
    "reagendado_por_id" TEXT,
    "criado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agendamentos_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios_funcionamento" (
    "empresa_id" TEXT NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_abertura" TEXT NOT NULL,
    "hora_fechamento" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "horarios_funcionamento_pkey" PRIMARY KEY ("empresa_id","dia_semana")
);

-- CreateTable
CREATE TABLE "horarios_trabalho" (
    "id" TEXT NOT NULL,
    "funcionario_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fim" TEXT NOT NULL,

    CONSTRAINT "horarios_trabalho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueios_agenda" (
    "id" TEXT NOT NULL,
    "funcionario_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "hora_inicio" TEXT,
    "hora_fim" TEXT,
    "motivo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueios_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "politicas_cancelamento" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "prazo_minimo_horas" INTEGER NOT NULL,
    "multa_percentual" DECIMAL(5,2),

    CONSTRAINT "politicas_cancelamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lista_espera" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "servico_id" TEXT NOT NULL,
    "funcionario_id" TEXT,
    "data_desejada" DATE NOT NULL,
    "atendida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lista_espera_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agendamentos_historico_agendamento_id_idx" ON "agendamentos_historico"("agendamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_trabalho_funcionario_id_empresa_id_dia_semana_key" ON "horarios_trabalho"("funcionario_id", "empresa_id", "dia_semana");

-- CreateIndex
CREATE INDEX "bloqueios_agenda_funcionario_id_data_idx" ON "bloqueios_agenda"("funcionario_id", "data");

-- CreateIndex
CREATE UNIQUE INDEX "politicas_cancelamento_empresa_id_key" ON "politicas_cancelamento"("empresa_id");

-- CreateIndex
CREATE INDEX "lista_espera_empresa_id_data_desejada_idx" ON "lista_espera"("empresa_id", "data_desejada");

-- CreateIndex
CREATE INDEX "lista_espera_atendida_idx" ON "lista_espera"("atendida");

-- CreateIndex
CREATE INDEX "clientes_data_nascimento_idx" ON "clientes"("data_nascimento");

-- AddForeignKey
ALTER TABLE "agendamentos_historico" ADD CONSTRAINT "agendamentos_historico_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios_funcionamento" ADD CONSTRAINT "horarios_funcionamento_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios_trabalho" ADD CONSTRAINT "horarios_trabalho_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios_trabalho" ADD CONSTRAINT "horarios_trabalho_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios_agenda" ADD CONSTRAINT "bloqueios_agenda_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios_agenda" ADD CONSTRAINT "bloqueios_agenda_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "politicas_cancelamento" ADD CONSTRAINT "politicas_cancelamento_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_espera" ADD CONSTRAINT "lista_espera_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_espera" ADD CONSTRAINT "lista_espera_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_espera" ADD CONSTRAINT "lista_espera_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_espera" ADD CONSTRAINT "lista_espera_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "comissoes_func_empresa_func_idx" RENAME TO "comissoes_funcionarios_empresa_id_funcionario_id_idx";

-- RenameIndex
ALTER INDEX "comissoes_func_unique_idx" RENAME TO "comissoes_funcionarios_funcionario_id_empresa_id_servico_id_key";
