import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",            // static HTML export -> ./out (deployed as a Render Static Site)
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
