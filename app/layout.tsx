import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://w-simce.colegioacropolis.net'),
  title: {
    default: 'W-SIMCE · Evaluación estandarizada · Colegio Acrópolis',
    template: '%s · W-SIMCE',
  },
  description:
    'Plataforma de evaluación estandarizada del Colegio Acrópolis: banco de ítems, ensayos, rendición en línea, corrección automática y reportes por eje y habilidad.',
  applicationName: 'W-SIMCE',
  icons: {
    icon: '/icono.png',
    apple: '/icono.png',
  },
  openGraph: {
    siteName: 'W-SIMCE',
    locale: 'es_CL',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#202858',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
