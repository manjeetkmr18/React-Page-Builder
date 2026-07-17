import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The example consumes the package from two directories above during local development.
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
  },
};

export default nextConfig;
