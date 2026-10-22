// Marca del producto: emblema del colegio + nombre. Se usa en el panel, en la
// ficha del alumno y en la rendición, así que debe verse igual en todas.
export function Marca({ subtitulo }: { subtitulo?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="block h-10 w-10 shrink-0 overflow-hidden rounded-full">
        <img
          src="/emblema-192.png"
          alt=""
          width={192}
          height={192}
          className="h-full w-full object-cover"
        />
      </span>
      <div className="min-w-0">
        <p className="text-[19px] font-semibold leading-tight tracking-[-0.01em]">
          <span className="text-acento-boton-hover">W</span>-SIMCE
        </p>
        {subtitulo ? <p className="truncate text-xs text-tenue">{subtitulo}</p> : null}
      </div>
    </div>
  );
}
