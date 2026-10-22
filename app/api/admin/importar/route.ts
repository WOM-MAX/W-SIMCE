import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { hashClave, sesionAdmin } from '@/lib/auth';
import { siguienteCodigo } from '@/lib/estudiantes';
import { volver } from '@/lib/http';

const MAX_FILAS = 500;

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export async function POST(request: Request) {
  const sesion = await sesionAdmin();
  if (!sesion) return volver(request, '/panel');

  const form = await request.formData();
  const archivo = form.get('archivo');

  if (!(archivo instanceof File) || archivo.size === 0) {
    return volver(request, '/admin?error=archivo');
  }

  try {
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(await archivo.arrayBuffer());
    const hoja = libro.worksheets[0];
    if (!hoja) return volver(request, '/admin?error=archivo');

    // Cabeceras por nombre, sin acentos ni mayúsculas.
    const columnas = new Map<string, number>();
    hoja.getRow(1).eachCell((celda, numero) => {
      columnas.set(normalizar(celda.text), numero);
    });

    const colNombres = columnas.get('nombres');
    const colApellidos = columnas.get('apellidos');
    const colPaterno =
      columnas.get('apellido paterno') ?? columnas.get('apellido paterno estud');
    const colMaterno =
      columnas.get('apellido materno') ?? columnas.get('apellido materno estud');
    const apellidosSeparados = Boolean(colPaterno && colMaterno);
    const colCurso = columnas.get('curso');
    const colPin = columnas.get('pin') ?? columnas.get('clave');
    const colRun = columnas.get('run') ?? columnas.get('rut');
    const colRetiro =
      columnas.get('fecha de retiro') ?? columnas.get('retiro') ?? columnas.get('estado');

    if (!colNombres || (!colApellidos && !apellidosSeparados) || !colCurso) {
      return volver(request, '/admin?error=columnas');
    }

    const cursos = await prisma.curso.findMany({
      where: { colegioId: sesion.colegioId },
      include: { nivel: true },
    });
    const porNombre = new Map<string, (typeof cursos)[number]>();
    for (const curso of cursos) {
      porNombre.set(normalizar(curso.nombre), curso);
      porNombre.set(normalizar(`${curso.nivel.nombre} ${curso.letra}`), curso);
    }

    // Para no duplicar al reimportar la misma planilla.
    const existentes = await prisma.estudiante.findMany({
      where: { colegioId: sesion.colegioId },
      include: { matriculas: { where: { estado: 'ACTIVA' } } },
    });
    const yaEstan = new Set<string>();
    for (const e of existentes) {
      for (const m of e.matriculas) {
        yaEstan.add(`${normalizar(e.nombres)}|${normalizar(e.apellidos)}|${m.cursoId}`);
      }
    }

    let creados = 0;
    let omitidos = 0;
    let errores = 0;
    const detalles: string[] = [];

    const ultimaFila = Math.min(hoja.rowCount, MAX_FILAS + 1);

    for (let numero = 2; numero <= ultimaFila; numero += 1) {
      const fila = hoja.getRow(numero);
      const nombres = fila.getCell(colNombres).text.trim();
      const apellidos = apellidosSeparados
      ? `${fila.getCell(colPaterno as number).text.trim()} ${fila.getCell(colMaterno as number).text.trim()}`.trim()
      : fila.getCell(colApellidos as number).text.trim();
      const nombreCurso = fila.getCell(colCurso).text.trim();
      const pin = (colPin ? fila.getCell(colPin).text.trim() : '') || '1234';
      const run = (colRun ? fila.getCell(colRun).text.trim().toUpperCase() : '') || null;
      const retiro = (colRetiro ? fila.getCell(colRetiro).text.trim() : '').toLowerCase();
      const esRetiro = retiro !== '' && !['no', 'activo', 'activa', '0'].includes(retiro);

      // Fila vacía o la nota aclaratoria al pie.
      if (!nombres && !apellidos && !nombreCurso) continue;
      if (normalizar(nombres).startsWith('una fila por estudiante')) continue;

      if (!nombres || !apellidos || !nombreCurso) {
        errores += 1;
        if (detalles.length < 5) detalles.push(`Fila ${numero}: faltan datos.`);
        continue;
      }

      // El alumno retirado no se carga: el libro lo marca con fecha de retiro.
      if (esRetiro) {
        omitidos += 1;
        if (detalles.length < 5) detalles.push(`Fila ${numero}: ${nombres} ${apellidos} figura retirado.`);
        continue;
      }

      const curso = porNombre.get(normalizar(nombreCurso));
      if (!curso) {
        errores += 1;
        if (detalles.length < 5) detalles.push(`Fila ${numero}: curso "${nombreCurso}" no existe.`);
        continue;
      }

      if (pin.length < 4) {
        errores += 1;
        if (detalles.length < 5) detalles.push(`Fila ${numero}: el PIN debe tener al menos 4 caracteres.`);
        continue;
      }

      const llave = `${normalizar(nombres)}|${normalizar(apellidos)}|${curso.id}`;
      if (yaEstan.has(llave)) {
        omitidos += 1;
        continue;
      }

      // El RUN es único por colegio: si ya está, la fila es un duplicado.
      if (run) {
        const repetido = await prisma.estudiante.findFirst({
          where: { colegioId: sesion.colegioId, run },
          select: { id: true },
        });
        if (repetido) {
          errores += 1;
          if (detalles.length < 5) detalles.push(`Fila ${numero}: el RUN ${run} ya está cargado.`);
          continue;
        }
      }

      const codigoAcceso = await siguienteCodigo(sesion.colegioId, `W${curso.nivel.codigo}-`);
      const estudiante = await prisma.estudiante.create({
        data: {
          colegioId: sesion.colegioId,
          nombres,
          apellidos,
          run,
          codigoAcceso,
          pinHash: hashClave(pin),
        },
      });
      await prisma.matricula.create({ data: { estudianteId: estudiante.id, cursoId: curso.id } });

      yaEstan.add(llave);
      creados += 1;
    }

    const params = new URLSearchParams({
      ok: 'importados',
      n: String(creados),
      o: String(omitidos),
      e: String(errores),
    });
    if (detalles.length) params.set('d', detalles.join(' | ').slice(0, 400));

    return volver(request, `/admin?${params.toString()}`);
  } catch (error) {
    console.error('importar estudiantes', error);
    return volver(request, '/admin?error=archivo');
  }
}
