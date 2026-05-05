-- CreateTable
CREATE TABLE "funcionario_servicos" (
    "funcionario_id" TEXT NOT NULL,
    "servico_id" TEXT NOT NULL,

    CONSTRAINT "funcionario_servicos_pkey" PRIMARY KEY ("funcionario_id","servico_id")
);

-- AddForeignKey
ALTER TABLE "funcionario_servicos" ADD CONSTRAINT "funcionario_servicos_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcionario_servicos" ADD CONSTRAINT "funcionario_servicos_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
