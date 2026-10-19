import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const inicio = Date.now();
  try {
    await prisma.$queryRaw`select 1`;
    const [colegios, cursos, estudiantes, items, ensayos] = await Promise.all([
      prisma.colegio.count(),
      prisma.curso.count(),
      prisma.estudiante.count(),
      prisma.item.count(),
      prisma.ensayo.count(),
    ]);
    return NextResponse.json({
      ok: true,
      app: 'W-SIMCE',
      base: 'neon',
      latenciaMs: Date.now() - inicio,
      conteos: { colegios, cursos, estudiantes, items, ensayos },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'error desconocido' },
      { status: 503 }
    );
  }
}
