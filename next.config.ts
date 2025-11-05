/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/corporate-advisors-websi-b43bd.firebasestorage.app/o/**',
      },
      // You can also use a more generic pattern for all Firebase Storage buckets:
      {
        protocol: 'https',
        hostname: '**.firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Optional: Configure image optimization limits
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig