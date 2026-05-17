-- Altera hora_inicio e hora_fim para TIMESTAMPTZ (timestamp com timezone)
-- Garante armazenamento explícito em UTC, eliminando ambiguidade de fuso horário

ALTER TABLE "agendamentos"
  ALTER COLUMN "hora_inicio" TYPE TIMESTAMPTZ(6),
  ALTER COLUMN "hora_fim"    TYPE TIMESTAMPTZ(6);
