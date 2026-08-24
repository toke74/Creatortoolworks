import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ToolCard } from "@/components/tool/tool-card";
import { siteConfig } from "@/lib/seo/site";
import { getVisitorFacingTools } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "YouTube Creator Tools",
  description: "Free utilities for YouTube titles, thumbnails, timestamps, descriptions, chapters, and monetization planning.",
  alternates: { canonical: `${siteConfig.url}/youtube-tools` },
};

export default function YouTubeToolsPage() {
  const visitorFacingTools = getVisitorFacingTools();

  return (
    <main className="site-container py-14 sm:py-16">
      <PageHeader
        eyebrow="Category"
        title="YouTube Creator Tools"
        description="Free, browser-based tools that help you get a YouTube video ready to publish. Nothing you upload leaves your device."
      />
      <h2 className="sr-only">Available tools</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visitorFacingTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
      </div>
      <p className="mt-10 text-sm text-[var(--text-muted)]">More creator tools are in progress and will appear here as they&apos;re ready.</p>
    </main>
  );
}
