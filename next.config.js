/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "agentic-a4797e1f.vercel.app"]
    }
  }
};

module.exports = nextConfig;
