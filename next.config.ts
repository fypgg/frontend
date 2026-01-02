const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    domains: [
      "images.unsplash.com",
      "via.placeholder.com",
      "madlads.s3.us-west-2.amazonaws.com",
      "img-cdn.magiceden.dev",
      "arweave.net",
      "cdn.betterttv.net",
      "metadata.degods.com",
      "i.imgur.com",
      "aurory-prod.s3.amazonaws.com",
      "sapphire-top-harrier-590.mypinata.cloud",
      "prod-livestream-thumbnails-841162682567.s3.us-east-1.amazonaws.com",
      "gateway.pinata.cloud",
      "pump.mypinata.cloud",
      "ipfs.io",
    ],
  },

  reactStrictMode: false,
  serverExternalPackages: ["@solana/web3.js"],
  rewrites: async () => [
    {
      source: "/ingest/static/:path*",
      destination: "https://us-assets.i.posthog.com/static/:path*",
    },
    {
      source: "/ingest/:path*",
      destination: "https://us.i.posthog.com/:path*",
    },
  ],
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

module.exports = nextConfig;
