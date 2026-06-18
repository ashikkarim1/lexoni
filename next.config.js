/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ---------------------------------------------------------------------------
  // IMAGES: Vercel optimises on demand and caches at the edge. AVIF first then
  // WebP shaves typical responsive payloads by ~70% vs the source JPEG. The
  // image cache is free for the first 1k source images on Vercel Hobby + Pro.
  // ---------------------------------------------------------------------------
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // a year for static images
  },

  // ---------------------------------------------------------------------------
  // EXPERIMENTAL
  // ---------------------------------------------------------------------------
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    // Per-icon imports tree-shake lucide so we don't ship the whole library.
    optimizePackageImports: ["lucide-react", "date-fns", "@anthropic-ai/sdk"],
  },

  // ---------------------------------------------------------------------------
  // SECURITY HEADERS
  // ---------------------------------------------------------------------------
  async headers() {
    // Content-Security-Policy. 'unsafe-inline' on script-src is required for
    // Next.js hydration data + JSON-LD scripts; tightening to nonces is a
    // separate project. 'unsafe-eval' is needed for Next dev refresh; we
    // keep it in production for Next's runtime compatibility shims.
    // Cloudflare Turnstile is explicitly allowed because HumanCheck embeds
    // its widget. Google Fonts (preconnect in app/layout.tsx) need
    // fonts.googleapis.com + fonts.gstatic.com.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob:",
      "connect-src 'self' https://challenges.cloudflare.com https://api.anthropic.com https://va.vercel-scripts.com",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      // Authentication and one-time-link surfaces — keep them out of search
      // indexes. Pages also carry `robots: { index: false }` in metadata;
      // this header catches edge cases (redirects, 404s) the metadata
      // can't reach.
      {
        source: "/signin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/verify-email/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/reset-password/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/accept-invite",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      // Long-cache for /public assets that don't change on deploy.
      {
        source: "/:path*\\.(jpg|jpeg|png|gif|svg|webp|avif|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  // Trims server-side imports of @anthropic-ai/sdk + resend out of the client
  // bundle. Both are server-only.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    }
    return config;
  },
};
module.exports = nextConfig;
