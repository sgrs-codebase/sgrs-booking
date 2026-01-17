import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Silence warning about workspace root by explicitly setting it
    root: process.cwd(),
  },
};

export default nextConfig;
