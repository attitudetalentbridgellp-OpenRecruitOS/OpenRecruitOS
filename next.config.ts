import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Keep PDF parsing libs as real Node dependencies so pdfjs can resolve
  // its worker files at runtime (avoids "fake worker" bundling issues).
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "mammoth", "word-extractor"],
};

export default nextConfig;
