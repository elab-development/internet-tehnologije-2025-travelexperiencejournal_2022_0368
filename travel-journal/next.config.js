/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // ── Security Headers ──
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Sprečava clickjacking (iframe embedding)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Sprečava MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // XSS filter u browseru
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Kontroliše Referer header
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // HSTS — forsira HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://unpkg.com",
              "img-src 'self' data: blob: https://images.unsplash.com https://*.tile.openstreetmap.org https://unpkg.com",
              "font-src 'self'",
              "connect-src 'self' https://api.unsplash.com https://nominatim.openstreetmap.org https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
      // CORS za API rute
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXTAUTH_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
