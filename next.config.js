import './src/env.js'

/** @type {import("next").NextConfig} */
const config = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        pathname: '/f/*',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
        pathname: '/f/*',
      },
      // 👇 Added to support the dynamic product placeholders from seed.ts
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
}

export default config