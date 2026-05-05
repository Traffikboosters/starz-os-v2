/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/starz-os.html', destination: '/starz-os' },
      ],
    };
  },
};

module.exports = nextConfig;
