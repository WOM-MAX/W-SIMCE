// Aviso que acompaña a cualquier pantalla donde aparezcan niveles de logro.
// Los cortes son del colegio: no reproducen la clasificación oficial SIMCE, que
// se define con puntajes de corte sobre la escala de cada prueba.
export function AvisoNiveles() {
  return (
    <p className="text-xs leading-relaxed text-tenue">
      Los niveles de logro son referenciales del colegio y no equivalen a los niveles
      oficiales SIMCE.
    </p>
  );
}
