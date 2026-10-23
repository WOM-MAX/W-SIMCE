-- Invitación de un solo uso para que un funcionario defina su propia clave.
-- El token viaja por correo; en la base solo queda su hash SHA-256.
ALTER TABLE "Usuario"
  ADD COLUMN "tokenInvitacion" TEXT,
  ADD COLUMN "invitacionExpira" TIMESTAMP(3);

CREATE UNIQUE INDEX "Usuario_tokenInvitacion_key" ON "Usuario"("tokenInvitacion");
