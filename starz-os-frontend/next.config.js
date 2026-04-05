/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'auth.starzcrm.traffikboosters.com',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig