/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para definir o timezone do Node.js
  env: {
    TZ: 'America/Sao_Paulo',
  },
  // Outras configurações existentes
  experimental: {
    serverActions: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
