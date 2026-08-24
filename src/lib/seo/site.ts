export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "CreatorToolWorks",
  tagline: "Practical tools for creators.",
  description:
    "Practical browser-based tools for creators, starting with YouTube utilities for thumbnails, titles, descriptions, chapters, timestamps, and monetization planning.",
  url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://creatortoolworks.com",
  contactEmail: "hello@creatortoolworks.com",
} as const;
