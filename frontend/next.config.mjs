/** @type {import('next').NextConfig} */

// Production security headers — matches the SafeGSA + WedgeOps deployment
// posture so a single edge security probe yields the same posture across
// every Factory build.
//
// CSP notes:
// - 'self' as the strict default for fetch / script / style.
// - 'unsafe-inline' on style-src because Tailwind v3 emits a small set of
//   inline style attributes at hydration time. Tightenable to a nonce in a
//   later pass once we audit which components emit them.
// - connect-src includes 'self' AND the API backend so the SPA can call
//   the Express service on a different port; tighten via NEXT_PUBLIC_API_URL
//   when we run behind a single edge.
// - frame-ancestors 'none' blocks clickjacking.
// - HSTS opt-in: TLS terminates at the edge in prod, so safe to enable.

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${API_ORIGIN}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const STATIC_CACHE_HEADERS = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

const nextConfig = {
  output: "standalone",
  async headers() {
    return [
      // Security headers on every route. Order: less-specific rules first
      // so later, more specific rules override headers on the same key.
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      // Lock in immutable cache for hashed Next assets at the framework
      // level so CDN edges don't fall back to short TTLs.
      {
        source: "/_next/static/:path*",
        headers: STATIC_CACHE_HEADERS,
      },
    ];
  },
};

export default nextConfig;
