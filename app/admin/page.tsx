import { redirect } from 'next/navigation';
import { sesionAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Marca } from '@/components/marca';

export const dynamic = 'force-dynamic';

const CLASE_INPUT =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500';

const MENSAJES: Record<string, string> = {
  usuario: 'Docente creado.',
  estudiante: 'Estudiante creado.',
  clave: 'Credencial actualizada.',
};

const ERRORES: Record<string, string> = {
  datos: 'Faltan datos obligatorios.',
  email: 'Ese correo ya existe o no es válido.',
  curso: 'Elige un curso válido.',
  clave: 'La clave o el PIN deben tener al menos 4 caracteres.',
  permiso: 'No tienes permisos de administración.',
  interno: 'No se pudo completar la operación.',
};

export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const sesion = await sesionAdmin();
  if (!sesion) redirect('/');

  const { ok, error } = await searchParams;
  const aviso = ok ? (MENSAJES[ok] ?? null) : null;
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

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Marca subtitulo="Administración de cuentas" />
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-slate-500 hover:text-slate-800">
              Volver al panel
            </a>
            <form action="/api/auth/logout" method="post">
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {aviso ? (
          <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">{aviso}</p>
        ) : null}
        {fallo ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{fallo}</p>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">Nuevo docente o directivo</h2>
            <p className="mt-1 mb-4 text-xs text-slate-500">
              La clave se guarda cifrada con scrypt. No se puede recuperar, solo restablecer.
            </p>
            <form action="/api/admin/usuarios" method="post" className="space-y-3">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                Nombre
                <input name="nombre" required placeholder="Ana Pérez" className={CLASE_INPUT} />
              </label>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                Correo
                <input name="email" type="email" required placeholder="ana@acropolis.cl" className={CLASE_INPUT} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Rol
                  <select name="rol" className={CLASE_INPUT} defaultValue="DOCENTE">
                    <option value="DOCENTE">Docente</option>
                    <option value="UTP">UTP</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </label>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Clave inicial
                  <input name="clave" required minLength={4} className={CLASE_INPUT} />
                </label>
              </div>
              <button className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Crear docente
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">Nuevo estudiante</h2>
            <p className="mt-1 mb-4 text-xs text-slate-500">
              El código de acceso se genera solo y es el que se entrega al estudiante.
            </p>
            <form action="/api/admin/estudiantes" method="post" className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Nombres
                  <input name="nombres" required placeholder="Martina" className={CLASE_INPUT} />
                </label>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Apellidos
                  <input name="apellidos" required placeholder="González Rojas" className={CLASE_INPUT} />
                </label>
              </div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                Curso
                <select name="cursoId" required className={CLASE_INPUT}>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} · {c.nivel.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                PIN inicial
                <input name="pin" required minLength={4} defaultValue="1234" className={CLASE_INPUT} />
              </label>
              <button className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
                Crear estudiante
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Docentes y equipo</h2>
            <span className="text-xs text-slate-400">{usuarios.length}</span>
          </div>
          <ul className="divide-y divide-slate-50">
            {usuarios.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{u.nombre}</p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
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
                    className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  />
                  <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                    Cambiar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Estudiantes</h2>
            <span className="text-xs text-slate-400">{estudiantes.length}</span>
          </div>
          <ul className="divide-y divide-slate-50">
            {estudiantes.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="w-20 font-mono text-xs text-slate-500">{e.codigoAcceso}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {e.nombres} {e.apellidos}
                  </p>
                  <p className="truncate text-xs text-slate-500">
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
                    className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  />
                  <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                    Cambiar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
