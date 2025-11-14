// next.config.js

const withMDX = require("@next/mdx")({
  // you can add remark/rehype plugins here later
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["ts", "tsx", "mdx"],
  experimental: {
    mdxRs: true,
  },
};

module.exports = withMDX(nextConfig);
