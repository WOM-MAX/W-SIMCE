import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Necesario para la imagen Docker de producción (server.js autocontenido).
  output: 'standalone',
  // Solo desarrollo: permite abrir la app por 127.0.0.1 además de localhost.
  allowedDevOrigins: ['127.0.0.1'],
};

export default config;
