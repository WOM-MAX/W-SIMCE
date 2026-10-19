export function Candado({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
    </svg>
  );
}

export function Marca({ subtitulo }: { subtitulo?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-borde bg-white text-slate-700">
        <Candado />
      </span>
      <div>
        <h1 className="text-lg font-semibold tracking-tight">W-SIMCE</h1>
        {subtitulo ? <p className="text-xs text-tenue">{subtitulo}</p> : null}
      </div>
    </div>
  );
}
