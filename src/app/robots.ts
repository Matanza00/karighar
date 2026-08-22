import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://thekarighar.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private/authenticated areas out of search results.
        disallow: ["/admin", "/pro/", "/bookings", "/profile", "/settings", "/notifications"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
