import { sesionActual } from '@/lib/auth';
import { crearEnsayoBorrador } from '@/lib/ensayos';
import { texto, volver } from '@/lib/http';

export async function POST(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');

  const form = await request.formData();
  const nivelId = texto(form, 'nivelId');
  const asignaturaId = texto(form, 'asignaturaId');
  const ejeId = texto(form, 'eje') || null;

  const personalizado = Number.parseInt(texto(form, 'preguntasPersonalizado'), 10);
  const preset = Number.parseInt(texto(form, 'preguntas'), 10);
  const preguntas = Number.isFinite(personalizado) ? personalizado : preset;

  const tiempoPersonalizado = Number.parseInt(texto(form, 'tiempoPersonalizado'), 10);
  const tiempoPreset = Number.parseInt(texto(form, 'tiempoMin'), 10);
  const tiempoMin = Number.isFinite(tiempoPersonalizado) ? tiempoPersonalizado : tiempoPreset;

  if (!nivelId || !asignaturaId) return volver(request, '/ensayos/nuevo?error=datos');
  if (!Number.isFinite(preguntas) || preguntas < 1 || preguntas > 100) {
    return volver(request, '/ensayos/nuevo?error=preguntas');
  }
  if (!Number.isFinite(tiempoMin) || tiempoMin < 0 || tiempoMin > 180) {
    return volver(request, '/ensayos/nuevo?error=tiempo');
  }

  try {
    const ensayo = await crearEnsayoBorrador(sesion.colegioId, {
      nivelId,
      asignaturaId,
      ejeId,
      preguntas,
      tiempoMin,
    });
    return volver(request, `/ensayos/nuevo?ok=creado&n=${ensayo.items}&id=${ensayo.id}`);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : '';
    if (mensaje === 'SIN_ITEMS') return volver(request, '/ensayos/nuevo?error=sinitems');
    if (mensaje === 'EJE_INVALIDO') return volver(request, '/ensayos/nuevo?error=eje');
    console.error('crear ensayo', error);
    return volver(request, '/ensayos/nuevo?error=interno');
  }
}
