/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;
