import { sesionAdmin } from '@/lib/auth';
import { purgarEventos } from '@/lib/eventos';
import { texto, volver } from '@/lib/http';

export async function POST(request: Request) {
  const sesion = await sesionAdmin();
  if (!sesion) return volver(request, '/panel');

  const form = await request.formData();
  const diasCrudos = Number.parseInt(texto(form, 'dias'), 10);
  const dias = Number.isFinite(diasCrudos) ? diasCrudos : 365;

  if (dias < 30) return volver(request, '/admin?error=retencion');

  try {
    const borrados = await purgarEventos(dias);
    return volver(request, `/admin?ok=mantenimiento&n=${borrados}`);
  } catch (error) {
    console.error('mantenimiento', error);
    return volver(request, '/admin?error=interno');
  }
}
