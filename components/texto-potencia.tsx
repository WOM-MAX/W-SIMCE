import { partirConPotencia } from '@/lib/texto';

// Pinta un texto con sus potencias en superindice. Conserva los saltos de linea
// porque los enunciados vienen con \n.
export function TextoPotencia({
  texto,
  className,
}: {
  texto: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {texto.split('\n').map((linea, i) => (
        <span key={i}>
          {i > 0 ? <br /> : null}
          {partirConPotencia(linea).map((tramo, k) =>
            tramo.supra ? <sup key={k}>{tramo.texto}</sup> : <span key={k}>{tramo.texto}</span>
          )}
        </span>
      ))}
    </span>
  );
}
