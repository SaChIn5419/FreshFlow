import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.serveousercontent.com",
    "*.lhr.life",
    "*.localhost.run",
  ],
};

export default nextConfig;
