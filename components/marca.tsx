// Marca del producto: emblema del colegio + nombre. Se usa en el panel, en la
// ficha del alumno y en la rendición, así que debe verse igual en todas.
export function Marca({ subtitulo }: { subtitulo?: string }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/logo-acropolis.webp"
        alt=""
        width={372}
        height={378}
        className="h-10 w-10 shrink-0"
      />
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-tight tracking-tight">W-SIMCE</p>
        {subtitulo ? <p className="truncate text-xs text-tenue">{subtitulo}</p> : null}
      </div>
    </div>
  );
}
