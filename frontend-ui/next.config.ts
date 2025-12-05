import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude problematic packages from bundling (they're Node.js server-only packages)
  // This prevents Next.js from trying to bundle these packages for the client
  // This works with both Turbopack and webpack
  serverExternalPackages: [
    'thread-stream',
    'pino',
    'pino-pretty',
  ],
};

export default nextConfig;
