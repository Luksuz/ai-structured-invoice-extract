/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    eslint: {
      // Warning: This allows production builds to successfully complete even if
      // your project has ESLint errors.
      ignoreDuringBuilds: true,
    },
    // Ignore TypeScript type checking errors during builds
    typescript: {
      // Warning: This allows production builds to successfully complete even if
      // your project has TypeScript errors.
      ignoreBuildErrors: true,
    },
  }
  
  module.exports = nextConfig 