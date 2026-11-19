// Merge into your existing next.config (do not replace it).
//
// 1) rewrites: custom domains call the API as /api/v1/... on THEIR OWN host.
//    In production Caddy sends /api/* to the Go server. For `next dev` or
//    `next start` without Caddy, this rewrite does the same.
// 2) headers: safe security headers for every page. (No Content-Security-
//    Policy here: it needs testing against your images, fonts and pixels.)
const API = process.env.API_INTERNAL_URL ?? "http://localhost:8080";

module.exports = {
  poweredByHeader: false,          // hide "X-Powered-By: Next.js"
  productionBrowserSourceMaps: false, // keep this off so source is not public

  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API}/api/v1/:path*` },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          // Only meaningful over HTTPS; browsers ignore it on http://localhost.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};