import { sesionActual } from '@/lib/auth';
import { informeDeAsignacion } from '@/lib/reportes';

function celda(valor: string | number | null | undefined): string {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return `"${texto.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') {
    return new Response('No autorizado', { status: 403 });
  }

  const url = new URL(request.url);
  const asignacionId = url.searchParams.get('asignacion');
  if (!asignacionId) return new Response('Falta el parámetro asignación', { status: 400 });

  const informe = await informeDeAsignacion(sesion, asignacionId);
  if (!informe) return new Response('Asignación no encontrada', { status: 404 });

  const lineas: string[] = [];
  lineas.push(['Curso', informe.curso].map(celda).join(','));
  lineas.push(['Ensayo', informe.titulo].map(celda).join(','));
  lineas.push(['Rendidos', informe.rendidos].map(celda).join(','));
  lineas.push(['Logro promedio', `${informe.promedioPct}%`].map(celda).join(','));
  lineas.push(['Escala promedio', informe.promedioEscala].map(celda).join(','));
  lineas.push('');

  lineas.push(['Código', 'Estudiante', 'Correctas', 'Total', 'Logro %', 'Escala', 'Nivel', 'Estado'].map(celda).join(','));
  for (const e of informe.estudiantes) {
    lineas.push(
      [e.codigo, e.nombre, e.correctas, e.total, e.pct, e.escala ?? '', e.nivel ?? '', e.estado]
        .map(celda)
        .join(',')
    );
  }

  const seccion = (titulo: string, filas: Array<{ clave: string; correctas: number; total: number; pct: number }>) => {
    lineas.push('');
    lineas.push([titulo].map(celda).join(','));
    lineas.push(['Clave', 'Correctas', 'Total', 'Logro %'].map(celda).join(','));
    for (const f of filas) {
      lineas.push([f.clave, f.correctas, f.total, f.pct].map(celda).join(','));
    }
  };

  seccion('Logro por eje', informe.porEje);
  seccion('Logro por habilidad', informe.porHabilidad);
  seccion('Logro por dificultad', informe.porDificultad);

  // BOM para que Excel respete los acentos.
  const csv = `\uFEFF${lineas.join('\r\n')}\r\n`;

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="reporte-${informe.id.slice(0, 8)}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
