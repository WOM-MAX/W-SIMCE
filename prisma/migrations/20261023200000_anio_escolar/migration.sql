-- Fase 3: el ensayo pertenece a un anio escolar y el anio tiene fechas.

ALTER TABLE "AnioEscolar"
  ADD COLUMN "fechaInicio" TIMESTAMP(3),
  ADD COLUMN "fechaCierre" TIMESTAMP(3);

ALTER TABLE "Ensayo" ADD COLUMN "anioId" UUID;

CREATE INDEX "Ensayo_colegioId_anioId_idx" ON "Ensayo"("colegioId", "anioId");

ALTER TABLE "Ensayo"
    ADD CONSTRAINT "Ensayo_anioId_fkey"
    FOREIGN KEY ("anioId") REFERENCES "AnioEscolar"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
