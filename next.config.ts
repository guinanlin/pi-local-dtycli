import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@mariozechner/pi-ai",
    "@mariozechner/pi-agent-core",
    "@sinclair/typebox",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  poweredByHeader: false,
};

export default nextConfig;
