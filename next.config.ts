import path from "path";
import type { NextConfig } from "next";

const APP_ROOT = path.resolve(__dirname);

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  outputFileTracingRoot: APP_ROOT,
  turbopack: {
    root: APP_ROOT,
  },
  experimental: {
    cpus: 1,
    webpackBuildWorker: false,
    webpackMemoryOptimizations: true,
  },
  transpilePackages: ["react-globe.gl", "three"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
