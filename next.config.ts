import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // PGlite ships WASM and data files that must be loaded from node_modules at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    serverActions: {
      // Item photos are resized on the device (main ≤1600px JPEG + thumbnail), well under this.
      // Vercel caps request bodies at 4.5 MB, so stay below that.
      bodySizeLimit: "4mb",
    },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
