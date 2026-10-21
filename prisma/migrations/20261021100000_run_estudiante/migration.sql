-- RUN del estudiante: identificador oficial del colegio (12345678-9).
-- Opcional para no bloquear cargas parciales; único por colegio cuando está presente.
ALTER TABLE "Estudiante" ADD COLUMN "run" TEXT;

CREATE UNIQUE INDEX "Estudiante_colegioId_run_key" ON "Estudiante"("colegioId", "run");
