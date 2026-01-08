import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Remove reactCompiler - it's not a valid option in Next.js 15.2.3
};

export default nextConfig;