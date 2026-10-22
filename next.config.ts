import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Necesario para la imagen Docker de producción (server.js autocontenido).
  output: 'standalone',
  // Solo desarrollo: permite abrir la app por 127.0.0.1 y por la IP de la red,
  // para revisar desde el teléfono o una tablet sin que se bloqueen los estilos.
  allowedDevOrigins: ['127.0.0.1', '192.168.1.88'],
  // resvg trae un binario nativo por plataforma. Se deja fuera del empaquetado
  // para que se cargue en tiempo de ejecución, no que webpack intente leerlo.
  serverExternalPackages: ['@resvg/resvg-js'],
};

export default config;
