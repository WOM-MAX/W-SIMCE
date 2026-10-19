import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Lectura deliberadamente dinamica. Con output: 'standalone', Next.js puede
// sustituir `process.env.DATABASE_URL` por su valor en el momento de compilar.
// El build de Railway no tiene esa variable, asi que quedaria escrita como
// undefined dentro del bundle y ninguna variable en ejecucion la arreglaria.
// Con corchetes la lectura ocurre siempre en tiempo de ejecucion.
function cadenaDeBase(): string | undefined {
  const clave = 'DATABASE_URL';
  const valor = process.env[clave];
  return valor && valor.length > 0 ? valor : undefined;
}

const url = cadenaDeBase();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(url ? { datasourceUrl: url } : {}),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
