/** @type {import('next').NextConfig} */
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const nextConfig = {
  // Configuracao do webpack para suprimir warnings conhecidos
  webpack: (config, { isServer }) => {
    // Suprimir warning critico do Supabase Realtime
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
      /Critical dependency: the request of a dependency is an expression/
    ];

    // Adiciona o plugin MiniCssExtractPlugin se ainda não estiver presente
    if (!config.plugins.some(p => p.constructor.name === 'MiniCssExtractPlugin')) {
      config.plugins.push(new MiniCssExtractPlugin());
    }
    
    return config;
  },
  
  // Define os cabecalhos de seguranca (headers), incluindo a Content Security Policy (CSP).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "connect-src 'self' http://localhost:4000 https://*.supabase.co wss://*.supabase.co",
              "img-src 'self' data: https://*",
              "font-src 'self' https://fonts.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "frame-src https://vercel.live",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://vercel.com/_vercel/insights/script.js",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default nextConfig; 