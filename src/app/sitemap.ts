import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://thekarighar.com";
  const paths = ["/", "/book", "/pro", "/support", "/terms", "/privacy", "/signin", "/signup"];
  return paths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly", priority: p === "/" ? 1 : 0.7 }));
}
