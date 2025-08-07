/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Exclude Supabase functions from build and suppress warnings
  webpack: (config, { dev }) => {
    // Ignore Supabase functions directory completely
    config.resolve.alias = {
      ...config.resolve.alias,
      // Ignore the entire supabase/functions directory
    };
    
    config.module.rules.push({
      test: /supabase[\/\\]functions[\/\\].*\.ts$/,
      use: 'ignore-loader'
    });

    // Suprimir warnings específicos do Supabase Realtime e Cache
    const originalWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings = [
      ...originalWarnings,
      // Suprimir warnings de dependências dinâmicas do RealtimeClient
      {
        module: /node_modules\/@supabase\/realtime-js\/dist\/main\/RealtimeClient\.js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      // Suprimir warnings gerais de realtime-js
      /Critical dependency: the request of a dependency is an expression.*realtime-js/,
      // Suprimir warnings de cache de strings grandes (tipos do Supabase são grandes)
      /Serializing big strings.*impacts deserialization performance/,
      // Suprimir warnings do dynamic-loader (são esperados)
      {
        module: /src[\/\\]lib[\/\\]modules[\/\\]dynamic-loader\.tsx/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    
    // Otimizar cache para arquivos grandes (tipos do Supabase)
    if (dev) {
      config.cache = {
        ...config.cache,
        compression: 'gzip', // Comprimir cache para reduzir tamanho
      };
    }
    
    return config;
  }
};

module.exports = nextConfig