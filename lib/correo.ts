// Envío de la invitación por correo. Usa la API HTTPS de Resend, sin SDK ni
// dependencias nuevas. Si no hay proveedor configurado no falla: devuelve el
// motivo para que la pantalla de administración muestre el enlace y alguien lo
// entregue a mano.

export type ResultadoEnvio = { enviado: boolean; motivo?: string };

type Invitacion = {
  para: string;
  nombre: string;
  colegio: string;
  rol: string;
  enlace: string;
};

const NOMBRE_ROL: Record<string, string> = {
  ADMIN: 'Administrador',
  UTP: 'UTP',
  DOCENTE: 'Docente',
};

function remitente(): string {
  return process.env['MAIL_FROM'] ?? 'W-SIMCE <no-reply@colegioacropolis.net>';
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function enviarInvitacion(datos: Invitacion): Promise<ResultadoEnvio> {
  const clave = process.env['RESEND_API_KEY'];
  if (!clave) {
    console.warn('correo: falta RESEND_API_KEY; la invitación no se envió');
    return { enviado: false, motivo: 'sin-proveedor' };
  }

  const rol = NOMBRE_ROL[datos.rol] ?? datos.rol;
  const texto = [
    `Hola ${datos.nombre}:`,
    '',
    `Te crearon una cuenta de ${rol} en W-SIMCE, del ${datos.colegio}.`,
    'Para entrar, define tu clave en este enlace:',
    '',
    datos.enlace,
    '',
    'El enlace sirve una sola vez y vence en siete días.',
    'Si no esperabas este correo, ignóralo: la cuenta queda sin clave utilizable.',
  ].join('\n');

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f4f5f9;font-family:Arial,Helvetica,sans-serif;color:#1f2a5a">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px">
          <tr><td>
            <p style="margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#7a8199">W-SIMCE</p>
            <h1 style="margin:0 0 16px;font-size:22px;color:#1f2a5a">Tu acceso al colegio</h1>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.6">Hola ${escapar(datos.nombre)}:</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6">
              Te crearon una cuenta de <strong>${escapar(rol)}</strong> en W-SIMCE, del ${escapar(datos.colegio)}.
              Define tu clave para entrar.
            </p>
            <p style="margin:0 0 24px">
              <a href="${escapar(datos.enlace)}" style="display:inline-block;background:#e8531f;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:15px;font-weight:bold">
                Definir mi clave
              </a>
            </p>
            <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280">
              El enlace sirve una sola vez y vence en siete días.
            </p>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280">
              Si no esperabas este correo, ignóralo: la cuenta queda sin clave utilizable.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  try {
    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clave}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: remitente(),
        to: [datos.para],
        subject: 'Tu acceso a W-SIMCE',
        text: texto,
        html,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => '');
      console.error('correo: el proveedor respondió', respuesta.status, detalle.slice(0, 300));
      return { enviado: false, motivo: 'proveedor' };
    }
    return { enviado: true };
  } catch (error) {
    console.error('correo: fallo al enviar la invitación', error);
    return { enviado: false, motivo: 'red' };
  }
}
