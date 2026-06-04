import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Cuando uses Supabase Storage, agregá tu proyecto acá:
      // { protocol: "https", hostname: "<project-ref>.supabase.co" },
    ],
  },
};

export default nextConfig;
