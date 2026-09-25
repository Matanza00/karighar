import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML/CSS/JS export -> produces an `out/` folder to upload to cPanel (public_html).
  output: "export",
  // Directory-style URLs (/book/ -> book/index.html) so Apache serves deep links on refresh.
  trailingSlash: true,
  // No Next.js image optimization server in a static export.
  images: { unoptimized: true },
};

export default nextConfig;
