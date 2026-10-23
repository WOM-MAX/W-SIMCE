-- Fase 1: alcance por curso, propiedad del ensayo y rol de direccion.

-- Direccion observa todo el colegio, sin permisos de gestion.
ALTER TYPE "Rol" ADD VALUE IF NOT EXISTS 'DIRECCION';

-- Cursos que atiende cada persona: define su alcance.
CREATE TABLE "MembresiaCurso" (
    "id" UUID NOT NULL,
    "membresiaId" UUID NOT NULL,
    "cursoId" UUID NOT NULL,

    CONSTRAINT "MembresiaCurso_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MembresiaCurso_membresiaId_cursoId_key"
    ON "MembresiaCurso"("membresiaId", "cursoId");

CREATE INDEX "MembresiaCurso_cursoId_idx" ON "MembresiaCurso"("cursoId");

ALTER TABLE "MembresiaCurso"
    ADD CONSTRAINT "MembresiaCurso_membresiaId_fkey"
    FOREIGN KEY ("membresiaId") REFERENCES "Membresia"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MembresiaCurso"
    ADD CONSTRAINT "MembresiaCurso_cursoId_fkey"
    FOREIGN KEY ("cursoId") REFERENCES "Curso"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Dueno del ensayo: quien lo creo. Nulo en los ensayos anteriores.
ALTER TABLE "Ensayo" ADD COLUMN "creadoPorId" UUID;

CREATE INDEX "Ensayo_colegioId_creadoPorId_idx"
    ON "Ensayo"("colegioId", "creadoPorId");

ALTER TABLE "Ensayo"
    ADD CONSTRAINT "Ensayo_creadoPorId_fkey"
    FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
