import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['next-dev.vikashkk.com'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vz-624830fb-ea4.b-cdn.net',
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;



 
