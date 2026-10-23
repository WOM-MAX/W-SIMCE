import { sesionActual, veTodoElColegio } from '@/lib/auth';
import { anioActual } from '@/lib/anio';
import { resumenDireccion } from '@/lib/direccion';

// Exportación de la vista de dirección: una fila por curso.
export async function GET(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario' || !veTodoElColegio(sesion)) {
    return new Response('No autorizado', { status: 403 });
  }

  const url = new URL(request.url);
  const pedido = url.searchParams.get('anio');
  const anio = pedido
    ? { id: pedido, anio: 0 }
    : await anioActual(sesion);

  if (!anio) return new Response('Sin año escolar', { status: 400 });

  const resumen = await resumenDireccion(sesion.colegioId, anio.id);

  const celda = (valor: string | number) => `"${String(valor).replace(/"/g, '""')}"`;
  const lineas: string[] = [];
  lineas.push(['Curso', 'Nivel', 'Matriculados', 'Rendidos', 'Logro %', 'Insuficiente', 'Elemental', 'Adecuado'].map(celda).join(','));
  for (const c of resumen.porCurso) {
    lineas.push(
      [c.nombre, c.nivel, c.matriculados, c.rendidos, c.promedioPct, c.insuficiente, c.elemental, c.adecuado]
        .map(celda)
        .join(','),
    );
  }
  lineas.push('');
  lineas.push(['Totales', '', resumen.matriculados, resumen.rendidos, resumen.promedioPct].map(celda).join(','));

  const csv = `\uFEFF${lineas.join('\r\n')}\r\n`;

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="direccion.csv"',
      'cache-control': 'no-store',
    },
  });
}
