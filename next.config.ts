/** @type {import('next').NextConfig} */

// API origin used by the /api/v1 rewrite (custom domains and `next start`
// without Caddy call the API on their own host). Set API_INTERNAL_URL in Vercel.
const API = (process.env.API_INTERNAL_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

// Hosts next/image may load from. The R2 host comes from the env var when it
// is set, and the current bucket is always included as a safe default.
const r2Host = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const imageHosts = [
  ...new Set(
    [
      "pub-26505cd19886412c924eeb2ebb98afb2.r2.dev", // R2 public bucket
      r2Host, // R2 host from NEXT_PUBLIC_R2_PUBLIC_URL (custom domain later)
      "res.cloudinary.com", // older products uploaded before R2
      "lh3.googleusercontent.com", // Google sign-in profile pictures
    ].filter(Boolean),
  ),
];

module.exports = {
  poweredByHeader: false, // hide "X-Powered-By: Next.js"
  productionBrowserSourceMaps: false, // keep source maps private

  images: {
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https",
      hostname,
      pathname: "/**",
    })),
  },

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