import type { NextConfig } from 'next';

const isElectronBuild = process.env.BUILD_TARGET === 'electron';

const nextConfig: NextConfig = {
  assetPrefix: isElectronBuild ? './' : undefined,
  images: {
    unoptimized: isElectronBuild,
  },
  output: isElectronBuild ? 'export' : undefined,
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/**/*.wasm', './node_modules/tiktoken/**/*.wasm'],
  },
  serverExternalPackages: ['tiktoken'],
  trailingSlash: isElectronBuild,
  transpilePackages: ['shiki', 'streamdown'],
};

export default nextConfig;
