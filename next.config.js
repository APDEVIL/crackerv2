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
        hostname: 'utfs.io',
        pathname: '/f/*',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
        pathname: '/f/*',
      },
    ],
  },
}

export default config
