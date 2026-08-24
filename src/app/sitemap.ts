import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/site";
import { tools } from "@/lib/tools/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const stablePages: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/youtube-tools`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteConfig.url}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteConfig.url}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteConfig.url}/privacy`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${siteConfig.url}/terms`, changeFrequency: "monthly", priority: 0.2 },
  ];

  const liveTools: MetadataRoute.Sitemap = tools
    .filter((tool) => tool.status === "live")
    .map((tool) => ({
      url: `${siteConfig.url}/youtube-tools/${tool.slug}`,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

  return [...stablePages, ...liveTools];
}
