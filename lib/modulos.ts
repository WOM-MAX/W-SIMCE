export type EstadoModulo = 'listo' | 'en-curso' | 'pendiente';

export type Modulo = {
  id: string;
  nombre: string;
  detalle: string;
  estado: EstadoModulo;
};

// Orden de construcción acordado: login, rendición, corrección, reportes.
export const MODULOS: Modulo[] = [
  {
    id: 'login',
    nombre: 'Acceso y sesiones',
    detalle: 'Docentes con correo y clave; estudiantes con código y PIN. Sesión firmada, sin dependencias.',
    estado: 'listo',
  },
  {
    id: 'admin',
    nombre: 'Administración de cuentas',
    detalle: 'Crear docentes y estudiantes, y restablecer claves y PIN.',
    estado: 'listo',
  },
  {
    id: 'rendicion',
    nombre: 'Rendición',
    detalle: 'Las 30 preguntas con reloj, autoguardado y cierre por tiempo en el servidor.',
    estado: 'pendiente',
  },
  {
    id: 'correccion',
    nombre: 'Corrección',
    detalle: 'Puntaje por ítem, resultado global y desglose por eje, habilidad, bloom y dificultad.',
    estado: 'pendiente',
  },
  {
    id: 'reportes',
    nombre: 'Reportes',
    detalle: 'Informe por curso y estudiante, con exportación para UTP.',
    estado: 'pendiente',
  },
];

export const ETIQUETA_ESTADO: Record<EstadoModulo, string> = {
  listo: 'Listo',
  'en-curso': 'En curso',
  pendiente: 'Pendiente',
};

export const CLASE_ESTADO: Record<EstadoModulo, string> = {
  listo: 'bg-teal-50 text-teal-700',
  'en-curso': 'bg-amber-50 text-amber-700',
  pendiente: 'bg-slate-100 text-slate-500',
};
