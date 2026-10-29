import type { NextConfig } from "next";

/**
 * Static export: the site is pre-rendered to plain HTML/CSS/JS in `out/`,
 * so it can be hosted on any static host or CDN without a Node server.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  // Don't auto-generate AGENTS.md when `next dev` runs under a coding agent.
  agentRules: false,
  experimental: {
    // All CSS is ~60 KB, so one shared stylesheet beats per-route chunks: navigations
    // and prefetches never have to preload (and possibly not use) another stylesheet.
    cssChunking: { type: "graph", requestCost: 100000 },
  },
};

export default nextConfig;
