/** @type {import('next').NextConfig} */
const nextConfig = {
  // NEW: correct place for external server packages in Next 15
  serverExternalPackages: ['ssh2'],

  webpack: (config, { isServer }) => {
    // your existing alias for client-only canvas
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }

    // allow loading native .node binaries
    config.module.rules.push({
      test: /\.node$/,
      use: { loader: 'node-loader' },
    });

    // don't try to polyfill server modules in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
      };
    }

    // ensure the native addon is loaded at runtime by Node (not bundled)
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'ssh2/lib/protocol/crypto/build/Release/sshcrypto.node':
          'commonjs ssh2/lib/protocol/crypto/build/Release/sshcrypto.node',
      });
    }

    return config;
  },

  // your existing headers
  async headers() {
    return [
      {
        source: '/reports/:path*',
        headers: [{ key: 'Content-Type', value: 'application/pdf' }],
      },
    ];
  },
};

export default nextConfig;
