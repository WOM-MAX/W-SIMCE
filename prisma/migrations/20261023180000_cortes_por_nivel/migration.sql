-- Fase 2: cortes de logro por nivel educativo.
--
-- Si un nivel no tiene fila, la aplicacion usa los cortes del colegio
-- (ConfiguracionColegio). No se copian datos: la primera vez que se guarden los
-- cortes de un nivel se crea su fila.

CREATE TABLE "CorteNivel" (
    "id" UUID NOT NULL,
    "colegioId" UUID NOT NULL,
    "nivelId" UUID NOT NULL,
    "corteElemental" INTEGER NOT NULL,
    "corteAdecuado" INTEGER NOT NULL,

    CONSTRAINT "CorteNivel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CorteNivel_colegioId_nivelId_key"
    ON "CorteNivel"("colegioId", "nivelId");

ALTER TABLE "CorteNivel"
    ADD CONSTRAINT "CorteNivel_colegioId_fkey"
    FOREIGN KEY ("colegioId") REFERENCES "Colegio"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CorteNivel"
    ADD CONSTRAINT "CorteNivel_nivelId_fkey"
    FOREIGN KEY ("nivelId") REFERENCES "Nivel"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
