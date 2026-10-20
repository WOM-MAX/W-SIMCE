// El formulario entrega una hora de pared de Chile y el servidor trabaja en UTC.
// Chile tiene horario de verano, asi que el desfase no se puede fijar a mano.

const ZONA = 'America/Santiago';

function desfaseMs(fecha: Date): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(fecha);

  const valor: Record<string, string> = {};
  for (const p of partes) valor[p.type] = p.value;

  const comoUtc = Date.UTC(
    Number(valor.year),
    Number(valor.month) - 1,
    Number(valor.day),
    Number(valor.hour) % 24,
    Number(valor.minute),
    Number(valor.second)
  );

  return comoUtc - fecha.getTime();
}

// 'AAAA-MM-DDTHH:mm' escrito en hora de Chile -> instante UTC.
export function desdeHoraChile(valor: string): Date | null {
  const m = valor.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;

  const tentativo = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  const desfase = desfaseMs(new Date(tentativo));
  return new Date(tentativo - desfase);
}

// Instante -> 'AAAA-MM-DDTHH:mm' en hora de Chile, para rellenar el formulario.
export function aHoraChile(fecha: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(fecha);

  const valor: Record<string, string> = {};
  for (const p of partes) valor[p.type] = p.value;

  return `${valor.year}-${valor.month}-${valor.day}T${String(Number(valor.hour) % 24).padStart(2, '0')}:${valor.minute}`;
}
