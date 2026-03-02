import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://covers.openlibrary.org/**"),
      new URL("https://owd74cfcecx6dz6j.public.blob.vercel-storage.com/**"),
    ],
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
