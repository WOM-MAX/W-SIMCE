import { redirect } from 'next/navigation';
import { sesionAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Panel } from '@/components/panel';

export const dynamic = 'force-dynamic';

const CLASE_INPUT =
  'mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm text-marca outline-none focus:border-acento';

const MENSAJES: Record<string, string> = {
  usuario: 'Docente creado.',
  estudiante: 'Estudiante creado.',
  clave: 'Credencial actualizada.',
  configuracion: 'Configuración guardada.',
};

const ERRORES: Record<string, string> = {
  datos: 'Faltan datos obligatorios.',
  email: 'Ese correo ya existe o no es válido.',
  run: 'Ese RUN ya está cargado en otro estudiante.',
  curso: 'Elige un curso válido.',
  clave: 'La clave o el PIN deben tener al menos 4 caracteres.',
  permiso: 'No tienes permisos de administración.',
  cortes: 'Los cortes deben ir de 0 a 100 y el segundo ser mayor que el primero.',
  archivo: 'No se pudo leer el archivo. Sube un .xlsx válido.',
  columnas: 'La planilla debe tener las columnas Nombres, Apellidos y Curso.',
  seleccion: 'No marcaste ningún estudiante.',
  retencion: 'El mínimo de conservación es de 30 días.',
  interno: 'No se pudo completar la operación.',
};

export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    error?: string;
    n?: string;
    o?: string;
    e?: string;
    d?: string;
  }>;
}) {
  const sesion = await sesionAdmin();
  if (!sesion) redirect('/');

  const { ok, error, n, o, e, d } = await searchParams;

  let aviso: string | null = null;
  if (ok === 'importados') {
    aviso = `Importados: ${n ?? '0'}. Omitidos por duplicado: ${o ?? '0'}. Con errores: ${e ?? '0'}.`;
    if (d) aviso = `${aviso} ${d}`;
  } else if (ok === 'borrados') {
    aviso = `Estudiantes borrados: ${n ?? '0'}.`;
  } else if (ok === 'mantenimiento') {
    aviso = `Registros de auditoría borrados: ${n ?? '0'}.`;
  } else if (ok) {
    aviso = MENSAJES[ok] ?? null;
  }

  const fallo = error ? (ERRORES[error] ?? ERRORES.interno) : null;

  const [usuarios, estudiantes, cursos] = await Promise.all([
    prisma.usuario.findMany({
      where: { membresias: { some: { colegioId: sesion.colegioId } } },
      include: { membresias: { where: { colegioId: sesion.colegioId } } },
      orderBy: { nombre: 'asc' },
    }),
    prisma.estudiante.findMany({
      where: { colegioId: sesion.colegioId },
      include: {
        matriculas: { where: { estado: 'ACTIVA' }, include: { curso: true } },
      },
      orderBy: { codigoAcceso: 'asc' },
    }),
    prisma.curso.findMany({
      where: { colegioId: sesion.colegioId },
      include: { nivel: true },
      orderBy: { nombre: 'asc' },
    }),
  ]);

  const eventos = await prisma.evento.count({
    where: { OR: [{ colegioId: sesion.colegioId }, { colegioId: null }] },
  });

  const configuracion =
    (await prisma.configuracionColegio.findUnique({
      where: { colegioId: sesion.colegioId },
    })) ?? {
      estudiantesVenResultados: false,
      corteElemental: 50,
      corteAdecuado: 75,
    };

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/admin">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-marca">Administración</h1>
          <p className="text-xs text-tenue">Cuentas y configuración del colegio</p>
        </div>
        {aviso ? (
          <p className="rounded-xl bg-acento-suave px-4 py-3 text-sm text-marca">{aviso}</p>
        ) : null}
        {fallo ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{fallo}</p>
        ) : null}

        <section className="rounded-2xl border border-borde bg-white p-6">
          <h2 className="text-base font-semibold text-marca">Resultados y niveles de logro</h2>
          <p className="mt-1 mb-4 text-xs text-tenue">
            Decide si el estudiante ve su puntaje y fija los cortes con que la UTP clasifica a cada
            curso.
          </p>
          <form
            action="/api/admin/configuracion"
            method="post"
            className="grid gap-4 sm:grid-cols-3"
          >
            <label className="flex items-start gap-3 sm:col-span-3">
              <input
                type="checkbox"
                name="estudiantesVenResultados"
                defaultChecked={configuracion.estudiantesVenResultados}
                className="mt-0.5 h-4 w-4 accent-acento"
              />
              <span className="text-sm text-slate-700">
                El estudiante ve su puntaje y su nivel de logro
                <span className="block text-xs text-tenue">
                  Si está desactivado, solo docentes y UTP ven los resultados.
                </span>
              </span>
            </label>
            <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
              Corte Insuficiente / Elemental (%)
              <input
                name="corteElemental"
                type="number"
                min="0"
                max="100"
                defaultValue={configuracion.corteElemental}
                className={CLASE_INPUT}
              />
            </label>
            <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
              Corte Elemental / Adecuado (%)
              <input
                name="corteAdecuado"
                type="number"
                min="0"
                max="100"
                defaultValue={configuracion.corteAdecuado}
                className={CLASE_INPUT}
              />
            </label>
            <div className="flex items-end">
              <button className="w-full rounded-lg bg-marca px-4 py-2 text-sm font-medium text-white hover:bg-marca-oscuro">
                Guardar
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-borde bg-white p-6">
          <h2 className="text-base font-semibold text-marca">Auditoría</h2>
          <p className="mt-1 text-xs text-tenue">
            {eventos} registros. Se guardan los inicios de sesión, la creación y el borrado de
            estudiantes, las asignaciones de ensayos y los envíos de pruebas. La política del colegio
            es conservarlos doce meses; el mínimo que permite el sistema son 30 días.
          </p>
          <form action="/api/admin/mantenimiento" method="post" className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
              Borrar registros con más de
              <input
                name="dias"
                type="number"
                min="30"
                defaultValue="365"
                className="mt-1 w-24 rounded-lg border border-borde px-2 py-1.5 text-sm text-marca"
              />
            </label>
            <button className="rounded-lg border border-borde px-3 py-2 text-xs text-slate-700 hover:bg-fondo">
              Purgar
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-borde bg-white p-6">
          <h2 className="text-base font-semibold text-marca">Importar estudiantes desde Excel</h2>
          <p className="mt-1 mb-4 text-xs text-tenue">
            Descarga la plantilla, completa una fila por estudiante y súbela. Los que ya existen en
            el mismo curso se omiten, así que puedes volver a subir la planilla sin duplicar.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <a
              href="/api/admin/plantilla"
              className="rounded-lg border border-borde px-3 py-2 text-xs text-slate-700 hover:bg-fondo"
            >
              Descargar plantilla
            </a>
            <form
              action="/api/admin/importar"
              method="post"
              encType="multipart/form-data"
              className="flex flex-wrap items-end gap-3"
            >
              <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
                Archivo .xlsx
                <input
                  name="archivo"
                  type="file"
                  accept=".xlsx"
                  required
                  className="mt-1 block text-xs text-slate-700"
                />
              </label>
              <button className="rounded-lg bg-marca px-4 py-2 text-sm font-medium text-white hover:bg-marca-oscuro">
                Importar
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-borde bg-white p-6">
            <h2 className="text-base font-semibold text-marca">Nuevo docente o directivo</h2>
            <p className="mt-1 mb-4 text-xs text-tenue">
              La clave se guarda cifrada con scrypt. No se puede recuperar, solo restablecer.
            </p>
            <form action="/api/admin/usuarios" method="post" className="space-y-3">
              <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
                Nombre
                <input name="nombre" required placeholder="Ana Pérez" className={CLASE_INPUT} />
              </label>
              <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
                Correo
                <input name="email" type="email" required placeholder="ana@acropolis.cl" className={CLASE_INPUT} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
                  Rol
                  <select name="rol" className={CLASE_INPUT} defaultValue="DOCENTE">
                    <option value="DOCENTE">Docente</option>
                    <option value="UTP">UTP</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </label>
                <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
                  Clave inicial
                  <input name="clave" required minLength={4} className={CLASE_INPUT} />
                </label>
              </div>
              <button className="w-full rounded-lg bg-marca px-4 py-2 text-sm font-medium text-white hover:bg-marca-oscuro">
                Crear docente
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-borde bg-white p-6">
            <h2 className="text-base font-semibold text-marca">Nuevo estudiante</h2>
            <p className="mt-1 mb-4 text-xs text-tenue">
              El código de acceso se genera solo y es el que se entrega al estudiante.
            </p>
            <form action="/api/admin/estudiantes" method="post" className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
                  Nombres
                  <input name="nombres" required placeholder="Martina" className={CLASE_INPUT} />
                </label>
                <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
                  Apellidos
                  <input name="apellidos" required placeholder="González Rojas" className={CLASE_INPUT} />
                </label>
              </div>
              <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
                Curso
                <select name="cursoId" required className={CLASE_INPUT}>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} · {c.nivel.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
                RUN (opcional)
                <input name="run" placeholder="12345678-9" className={CLASE_INPUT} />
              </label>
              <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
                PIN inicial
                <input name="pin" required minLength={4} defaultValue="1234" className={CLASE_INPUT} />
              </label>
              <button className="w-full rounded-lg bg-acento-boton px-4 py-2 text-sm font-medium text-white hover:bg-acento-boton-hover">
                Crear estudiante
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-2xl border border-borde bg-white">
          <div className="flex items-center justify-between border-b border-borde px-5 py-4">
            <h2 className="font-semibold text-marca">Docentes y equipo</h2>
            <span className="text-xs text-tenue">{usuarios.length}</span>
          </div>
          <ul className="divide-y divide-borde">
            {usuarios.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{u.nombre}</p>
                  <p className="truncate text-xs text-tenue">{u.email}</p>
                </div>
                <span className="rounded-full bg-borde px-2.5 py-1 text-xs text-slate-600">
                  {u.membresias[0]?.rol ?? 'SIN ROL'}
                </span>
                <form action="/api/admin/clave" method="post" className="flex items-center gap-2">
                  <input type="hidden" name="tipo" value="usuario" />
                  <input type="hidden" name="id" value={u.id} />
                  <input
                    name="valor"
                    required
                    minLength={4}
                    placeholder="Nueva clave"
                    className="w-32 rounded-lg border border-borde px-2 py-1 text-xs"
                  />
                  <button className="rounded-lg border border-borde px-2 py-1 text-xs text-slate-600 hover:bg-fondo">
                    Cambiar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <form id="borrar-estudiantes" action="/api/admin/eliminar-estudiantes" method="post" />

        <section className="rounded-2xl border border-borde bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borde px-5 py-4">
            <h2 className="font-semibold text-marca">Estudiantes</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-tenue">{estudiantes.length}</span>
              <button
                form="borrar-estudiantes"
                className="rounded-lg border border-acento px-3 py-1.5 text-xs font-medium text-acento-oscuro hover:bg-acento-suave"
                title="Borra los estudiantes marcados, con sus intentos y respuestas"
              >
                Borrar marcados
              </button>
            </div>
          </div>
          <p className="border-b border-borde bg-fondo px-5 py-2 text-xs text-tenue">
            Borrar un estudiante elimina también sus intentos y respuestas. Marca con cuidado.
          </p>
          <ul className="divide-y divide-borde">
            {estudiantes.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <input
                  type="checkbox"
                  name="ids"
                  value={e.id}
                  form="borrar-estudiantes"
                  aria-label={`Marcar a ${e.nombres} ${e.apellidos}`}
                  className="h-4 w-4 accent-acento"
                />
                <span className="w-20 font-mono text-xs text-tenue">{e.codigoAcceso}</span>
                <span className="w-24 font-mono text-xs text-tenue">{e.run ?? '—'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {e.nombres} {e.apellidos}
                  </p>
                  <p className="truncate text-xs text-tenue">
                    {e.matriculas[0]?.curso.nombre ?? 'Sin matrícula activa'}
                  </p>
                </div>
                <form action="/api/admin/clave" method="post" className="flex items-center gap-2">
                  <input type="hidden" name="tipo" value="estudiante" />
                  <input type="hidden" name="id" value={e.id} />
                  <input
                    name="valor"
                    required
                    minLength={4}
                    placeholder="Nuevo PIN"
                    className="w-28 rounded-lg border border-borde px-2 py-1 text-xs"
                  />
                  <button className="rounded-lg border border-borde px-2 py-1 text-xs text-slate-600 hover:bg-fondo">
                    Cambiar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Panel>
  );
}
