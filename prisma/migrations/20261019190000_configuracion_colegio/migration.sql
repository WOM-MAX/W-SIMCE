-- Tabla de configuracion por colegio
CREATE TABLE "ConfiguracionColegio" (
    "colegioId" UUID NOT NULL,
    "estudiantesVenResultados" BOOLEAN NOT NULL DEFAULT false,
    "corteElemental" INTEGER NOT NULL DEFAULT 50,
    "corteAdecuado" INTEGER NOT NULL DEFAULT 75,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionColegio_pkey" PRIMARY KEY ("colegioId")
);

-- AddForeignKey
ALTER TABLE "ConfiguracionColegio" ADD CONSTRAINT "ConfiguracionColegio_colegioId_fkey" FOREIGN KEY ("colegioId") REFERENCES "Colegio"("id") ON DELETE CASCADE ON UPDATE CASCADE;