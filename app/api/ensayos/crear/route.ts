import { sesionActual } from '@/lib/auth';
import { puedeEditar } from '@/lib/alcance';
import { anioActual } from '@/lib/anio';
import { crearEnsayoBorrador } from '@/lib/ensayos';
import { texto, volver } from '@/lib/http';

export async function POST(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');
  if (!(await puedeEditar(sesion))) return volver(request, '/ensayos?error=permiso');

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

  const evitar = Number.parseInt(texto(form, 'evitar'), 10);
  const evitarValido = [0, 3, 6, 999].includes(evitar) ? evitar : 3;

  if (!nivelId || !asignaturaId) return volver(request, '/ensayos/nuevo?error=datos');
  if (!Number.isFinite(preguntas) || preguntas < 1 || preguntas > 100) {
    return volver(request, '/ensayos/nuevo?error=preguntas');
  }
  if (!Number.isFinite(tiempoMin) || tiempoMin < 0 || tiempoMin > 180) {
    return volver(request, '/ensayos/nuevo?error=tiempo');
  }

  try {
    const anio = await anioActual(sesion);
    const ensayo = await crearEnsayoBorrador(
      sesion.colegioId,
      {
        nivelId,
        asignaturaId,
        ejeId,
        preguntas,
        tiempoMin,
        evitar: evitarValido,
      },
      sesion.id,
      anio?.id ?? null
    );
    return volver(
      request,
      (() => {
      const modo = texto(form, 'modo');
      const tam = texto(form, 'tamano');
      const tamano = tam === 'a4' || tam === 'oficio' ? tam : 'carta';
      if (modo === 'imprimible') {
        return `/api/ensayos/${ensayo.id}/docx?tamano=${tamano}`;
      }
      return `/ensayos/nuevo?ok=creado&n=${ensayo.items}&rep=${ensayo.repetidas}&id=${ensayo.id}`;
    })()
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : '';
    if (mensaje === 'SIN_ITEMS') return volver(request, '/ensayos/nuevo?error=sinitems');
    if (mensaje === 'EJE_INVALIDO') return volver(request, '/ensayos/nuevo?error=eje');
    console.error('crear ensayo', error);
    return volver(request, '/ensayos/nuevo?error=interno');
  }
}
