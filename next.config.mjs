/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    instantInsights: {
      // Solo se valida la "navegación instantánea" en los segmentos que exporten
      // `instant`. Las pantallas con sesión se dibujan solo en el navegador (la sesión
      // vive en localStorage), así que con la validación por defecto ('warning')
      // cada página mostraba un error en desarrollo.
      validationLevel: 'manual-warning',
    },
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
