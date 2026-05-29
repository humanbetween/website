import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.humanbetween.ai",
      },
    ],
  },
};

export default nextConfig;
