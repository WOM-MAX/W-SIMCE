import { sesionActual } from '@/lib/auth';
import { cargarDocumento, nombreArchivo, tamanoDe } from '@/lib/documento';
import { documentoDocx } from '@/lib/ensayo-docx';
import { volver } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');

  const { id } = await params;
  const url = new URL(request.url);
  const tamano = tamanoDe(url.searchParams.get('tamano'));
  const conClave = url.searchParams.get('clave') === '1';

  const doc = await cargarDocumento(id, sesion.colegioId, { conClave, tamano });
  if (!doc) return volver(request, '/ensayos?error=ensayo');

  try {
    const buffer = await documentoDocx(doc);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${nombreArchivo(doc, 'docx')}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('docx', error);
    return volver(request, '/ensayos?error=documento');
  }
}
