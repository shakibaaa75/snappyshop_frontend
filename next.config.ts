const API = process.env.API_INTERNAL_URL ?? "http://localhost:8080";

// R2 host: from the env var if set, plus the one you're using now.
const r2Host = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").hostname;
  } catch {
    return null;
  }
})();
const imageHosts = [
  ...new Set([
    "pub-26505cd19886412c924eeb2ebb98afb2.r2.dev",
    r2Host,
  ].filter(Boolean)),
];

module.exports = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

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
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};