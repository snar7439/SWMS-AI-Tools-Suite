/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Configure PDF.js for client-side rendering
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    
    return config;
  },
  // Enable static file serving for PDFs
  async headers() {
    return [
      {
        source: '/reports/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/pdf',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
