-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'UTP', 'DOCENTE');

-- CreateEnum
CREATE TYPE "EstadoItem" AS ENUM ('BORRADOR', 'REVISION', 'APROBADO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "EstadoEnsayo" AS ENUM ('BORRADOR', 'PUBLICADO');

-- CreateEnum
CREATE TYPE "OrigenEnsayo" AS ENUM ('MANUAL', 'ALEATORIO', 'IMPORTADO');

-- CreateEnum
CREATE TYPE "EstadoIntento" AS ENUM ('EN_CURSO', 'ENVIADO', 'EXPIRADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "EstadoMatricula" AS ENUM ('ACTIVA', 'RETIRADA');

-- CreateEnum
CREATE TYPE "Dimension" AS ENUM ('EJE', 'HABILIDAD', 'BLOOM', 'DIFICULTAD');

-- CreateTable
CREATE TABLE "Colegio" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "rbd" TEXT,
    "comuna" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Colegio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnioEscolar" (
    "id" UUID NOT NULL,
    "colegioId" UUID NOT NULL,
    "anio" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',

    CONSTRAINT "AnioEscolar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "hashPassword" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membresia" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "colegioId" UUID NOT NULL,
    "rol" "Rol" NOT NULL,

    CONSTRAINT "Membresia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nivel" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "Nivel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asignatura" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Asignatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eje" (
    "id" UUID NOT NULL,
    "nivelId" UUID NOT NULL,
    "asignaturaId" UUID NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Eje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objetivo" (
    "id" UUID NOT NULL,
    "ejeId" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "usaEnEnsayos" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Objetivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Indicador" (
    "id" UUID NOT NULL,
    "objetivoId" UUID NOT NULL,
    "texto" TEXT NOT NULL,

    CONSTRAINT "Indicador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curso" (
    "id" UUID NOT NULL,
    "colegioId" UUID NOT NULL,
    "anioId" UUID NOT NULL,
    "nivelId" UUID NOT NULL,
    "letra" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estudiante" (
    "id" UUID NOT NULL,
    "colegioId" UUID NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "codigoAcceso" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "Estudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matricula" (
    "id" UUID NOT NULL,
    "estudianteId" UUID NOT NULL,
    "cursoId" UUID NOT NULL,
    "estado" "EstadoMatricula" NOT NULL DEFAULT 'ACTIVA',
    "desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Matricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nivelId" UUID NOT NULL,
    "asignaturaId" UUID NOT NULL,
    "ejeId" UUID NOT NULL,
    "objetivoId" UUID,
    "habilidad" TEXT NOT NULL,
    "bloom" TEXT NOT NULL,
    "conocimiento" TEXT NOT NULL,
    "dificultad" TEXT NOT NULL,
    "estado" "EstadoItem" NOT NULL DEFAULT 'BORRADOR',
    "figuraId" UUID,
    "textoId" UUID,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemVersion" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "enunciado" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "justificacion" TEXT NOT NULL,
    "hashContenido" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alternativa" (
    "id" UUID NOT NULL,
    "itemVersionId" UUID NOT NULL,
    "letra" TEXT NOT NULL,
    "texto" TEXT,
    "esClave" BOOLEAN NOT NULL DEFAULT false,
    "justificacionError" TEXT NOT NULL,

    CONSTRAINT "Alternativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Figura" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "primitivas" JSONB NOT NULL,
    "ancho" INTEGER NOT NULL,
    "alto" INTEGER NOT NULL,

    CONSTRAINT "Figura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextoLectura" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "fuente" TEXT,
    "palabras" INTEGER,

    CONSTRAINT "TextoLectura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ensayo" (
    "id" UUID NOT NULL,
    "colegioId" UUID,
    "nivelId" UUID NOT NULL,
    "asignaturaId" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "tiempoMin" INTEGER NOT NULL,
    "estado" "EstadoEnsayo" NOT NULL DEFAULT 'BORRADOR',
    "origen" "OrigenEnsayo" NOT NULL DEFAULT 'IMPORTADO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ensayo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnsayoItem" (
    "id" UUID NOT NULL,
    "ensayoId" UUID NOT NULL,
    "orden" INTEGER NOT NULL,
    "itemVersionId" UUID NOT NULL,
    "puntaje" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "EnsayoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asignacion" (
    "id" UUID NOT NULL,
    "ensayoId" UUID NOT NULL,
    "cursoId" UUID NOT NULL,
    "docenteId" UUID,
    "abreEn" TIMESTAMP(3) NOT NULL,
    "cierraEn" TIMESTAMP(3) NOT NULL,
    "intentosPermitidos" INTEGER NOT NULL DEFAULT 1,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intento" (
    "id" UUID NOT NULL,
    "asignacionId" UUID NOT NULL,
    "estudianteId" UUID NOT NULL,
    "numero" INTEGER NOT NULL DEFAULT 1,
    "estado" "EstadoIntento" NOT NULL DEFAULT 'EN_CURSO',
    "iniciadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "enviadoEn" TIMESTAMP(3),
    "tiempoUsadoSeg" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Intento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentoItem" (
    "id" UUID NOT NULL,
    "intentoId" UUID NOT NULL,
    "orden" INTEGER NOT NULL,
    "itemVersionId" UUID NOT NULL,
    "ejeClave" TEXT NOT NULL,
    "habilidad" TEXT NOT NULL,
    "bloom" TEXT NOT NULL,
    "dificultad" TEXT NOT NULL,

    CONSTRAINT "IntentoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Respuesta" (
    "id" UUID NOT NULL,
    "intentoItemId" UUID NOT NULL,
    "letra" TEXT,
    "correcta" BOOLEAN NOT NULL DEFAULT false,
    "respondidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "segundos" INTEGER,

    CONSTRAINT "Respuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoIntento" (
    "id" UUID NOT NULL,
    "intentoId" UUID NOT NULL,
    "correctas" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "pctLogro" DECIMAL(5,2) NOT NULL,
    "puntajeEscala" INTEGER,
    "nivelLogro" TEXT,
    "algoritmoVersion" TEXT NOT NULL DEFAULT 'v1',
    "calculadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultadoIntento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoDimension" (
    "id" UUID NOT NULL,
    "intentoId" UUID NOT NULL,
    "dimension" "Dimension" NOT NULL,
    "clave" TEXT NOT NULL,
    "correctas" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "pct" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "ResultadoDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" UUID NOT NULL,
    "colegioId" UUID,
    "actorId" UUID,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "payload" JSONB,
    "ocurridoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Colegio_rbd_key" ON "Colegio"("rbd");

-- CreateIndex
CREATE UNIQUE INDEX "AnioEscolar_colegioId_anio_key" ON "AnioEscolar"("colegioId", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Membresia_usuarioId_colegioId_key" ON "Membresia"("usuarioId", "colegioId");

-- CreateIndex
CREATE UNIQUE INDEX "Nivel_codigo_key" ON "Nivel"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Asignatura_codigo_key" ON "Asignatura"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Eje_nivelId_asignaturaId_clave_key" ON "Eje"("nivelId", "asignaturaId", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "Objetivo_ejeId_codigo_key" ON "Objetivo"("ejeId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_colegioId_anioId_nivelId_letra_key" ON "Curso"("colegioId", "anioId", "nivelId", "letra");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_colegioId_codigoAcceso_key" ON "Estudiante"("colegioId", "codigoAcceso");

-- CreateIndex
CREATE UNIQUE INDEX "Matricula_estudianteId_cursoId_desde_key" ON "Matricula"("estudianteId", "cursoId", "desde");

-- CreateIndex
CREATE UNIQUE INDEX "Item_codigo_key" ON "Item"("codigo");

-- CreateIndex
CREATE INDEX "Item_nivelId_asignaturaId_ejeId_idx" ON "Item"("nivelId", "asignaturaId", "ejeId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemVersion_itemId_version_key" ON "ItemVersion"("itemId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Alternativa_itemVersionId_letra_key" ON "Alternativa"("itemVersionId", "letra");

-- CreateIndex
CREATE UNIQUE INDEX "Figura_codigo_key" ON "Figura"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "TextoLectura_codigo_key" ON "TextoLectura"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "EnsayoItem_ensayoId_orden_key" ON "EnsayoItem"("ensayoId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "EnsayoItem_ensayoId_itemVersionId_key" ON "EnsayoItem"("ensayoId", "itemVersionId");

-- CreateIndex
CREATE INDEX "Asignacion_cursoId_idx" ON "Asignacion"("cursoId");

-- CreateIndex
CREATE INDEX "Intento_asignacionId_estado_idx" ON "Intento"("asignacionId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Intento_asignacionId_estudianteId_numero_key" ON "Intento"("asignacionId", "estudianteId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "IntentoItem_intentoId_orden_key" ON "IntentoItem"("intentoId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "IntentoItem_intentoId_itemVersionId_key" ON "IntentoItem"("intentoId", "itemVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Respuesta_intentoItemId_key" ON "Respuesta"("intentoItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoIntento_intentoId_key" ON "ResultadoIntento"("intentoId");

-- CreateIndex
CREATE INDEX "ResultadoDimension_dimension_clave_idx" ON "ResultadoDimension"("dimension", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoDimension_intentoId_dimension_clave_key" ON "ResultadoDimension"("intentoId", "dimension", "clave");

-- CreateIndex
CREATE INDEX "Evento_entidad_entidadId_idx" ON "Evento"("entidad", "entidadId");

-- AddForeignKey
ALTER TABLE "AnioEscolar" ADD CONSTRAINT "AnioEscolar_colegioId_fkey" FOREIGN KEY ("colegioId") REFERENCES "Colegio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_colegioId_fkey" FOREIGN KEY ("colegioId") REFERENCES "Colegio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eje" ADD CONSTRAINT "Eje_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "Nivel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eje" ADD CONSTRAINT "Eje_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "Asignatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objetivo" ADD CONSTRAINT "Objetivo_ejeId_fkey" FOREIGN KEY ("ejeId") REFERENCES "Eje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicador" ADD CONSTRAINT "Indicador_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "Objetivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_colegioId_fkey" FOREIGN KEY ("colegioId") REFERENCES "Colegio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_anioId_fkey" FOREIGN KEY ("anioId") REFERENCES "AnioEscolar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "Nivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_colegioId_fkey" FOREIGN KEY ("colegioId") REFERENCES "Colegio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "Nivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "Asignatura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_ejeId_fkey" FOREIGN KEY ("ejeId") REFERENCES "Eje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "Objetivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_figuraId_fkey" FOREIGN KEY ("figuraId") REFERENCES "Figura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_textoId_fkey" FOREIGN KEY ("textoId") REFERENCES "TextoLectura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVersion" ADD CONSTRAINT "ItemVersion_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternativa" ADD CONSTRAINT "Alternativa_itemVersionId_fkey" FOREIGN KEY ("itemVersionId") REFERENCES "ItemVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ensayo" ADD CONSTRAINT "Ensayo_colegioId_fkey" FOREIGN KEY ("colegioId") REFERENCES "Colegio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ensayo" ADD CONSTRAINT "Ensayo_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "Nivel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ensayo" ADD CONSTRAINT "Ensayo_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "Asignatura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnsayoItem" ADD CONSTRAINT "EnsayoItem_ensayoId_fkey" FOREIGN KEY ("ensayoId") REFERENCES "Ensayo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnsayoItem" ADD CONSTRAINT "EnsayoItem_itemVersionId_fkey" FOREIGN KEY ("itemVersionId") REFERENCES "ItemVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_ensayoId_fkey" FOREIGN KEY ("ensayoId") REFERENCES "Ensayo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intento" ADD CONSTRAINT "Intento_asignacionId_fkey" FOREIGN KEY ("asignacionId") REFERENCES "Asignacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intento" ADD CONSTRAINT "Intento_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentoItem" ADD CONSTRAINT "IntentoItem_intentoId_fkey" FOREIGN KEY ("intentoId") REFERENCES "Intento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentoItem" ADD CONSTRAINT "IntentoItem_itemVersionId_fkey" FOREIGN KEY ("itemVersionId") REFERENCES "ItemVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respuesta" ADD CONSTRAINT "Respuesta_intentoItemId_fkey" FOREIGN KEY ("intentoItemId") REFERENCES "IntentoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoIntento" ADD CONSTRAINT "ResultadoIntento_intentoId_fkey" FOREIGN KEY ("intentoId") REFERENCES "Intento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoDimension" ADD CONSTRAINT "ResultadoDimension_intentoId_fkey" FOREIGN KEY ("intentoId") REFERENCES "ResultadoIntento"("intentoId") ON DELETE CASCADE ON UPDATE CASCADE;

