import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withMDX = createMDX({
  // Optional: you could add rehype/remark plugins here later if you want
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  pageExtensions: ["ts", "tsx", "mdx"], // Let Next handle .mdx pages too
};

export default withMDX(nextConfig);
