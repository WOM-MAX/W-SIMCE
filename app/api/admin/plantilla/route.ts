import ExcelJS from 'exceljs';
import { sesionAdmin } from '@/lib/auth';

export async function GET() {
  const sesion = await sesionAdmin();
  if (!sesion) return new Response('No autorizado', { status: 403 });

  const libro = new ExcelJS.Workbook();
  libro.creator = 'W-SIMCE';
  const hoja = libro.addWorksheet('Estudiantes');

  hoja.columns = [
    { header: 'RUN', key: 'run', width: 14 },
    { header: 'Nombres', key: 'nombres', width: 26 },
    { header: 'Apellidos', key: 'apellidos', width: 30 },
    { header: 'Curso', key: 'curso', width: 22 },
    { header: 'PIN', key: 'pin', width: 10 },
  ];
  hoja.getRow(1).font = { bold: true };

  hoja.addRow({
    run: '12345678-9',
    nombres: 'Martina',
    apellidos: 'González Rojas',
    curso: '4° básico B',
    pin: '1234',
  });

  const nota = hoja.addRow({});
  nota.getCell(1).value =
    'Una fila por estudiante. El RUN es opcional pero no puede repetirse. El curso debe coincidir con el nombre exacto que aparece en el sistema. Si dejas el PIN vacío se usa 1234.';
  nota.font = { italic: true, size: 9, color: { argb: 'FF5A6480' } };

  const buffer = await libro.xlsx.writeBuffer();

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': 'attachment; filename="plantilla-estudiantes.xlsx"',
      'cache-control': 'no-store',
    },
  });
}
