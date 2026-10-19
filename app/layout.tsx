import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'W-SIMCE',
  description: 'Plataforma de evaluación estandarizada para colegios de Chile',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
