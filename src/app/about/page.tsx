import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "About",
  description: "What CreatorToolWorks builds and how it works: free, browser-based tools for creators.",
  alternates: { canonical: `${siteConfig.url}/about` },
};

export default function AboutPage() {
  return (
    <main className="site-container py-14 sm:py-16">
      <PageHeader
        eyebrow="About"
        title="About CreatorToolWorks"
        description="Practical, browser-based tools for creators — built to be fast, free, and honest about what they do."
      />

      <section className="mt-12 max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">What we build</h2>
        <p className="mt-4 leading-7 text-[var(--text-muted)]">
          CreatorToolWorks makes small, practical tools that solve a specific task a creator has right in front of
          them — checking a thumbnail before upload, formatting a description, generating timestamps. We started
          with YouTube utilities and plan to add more creator tools over time, across more categories, as each one
          proves genuinely useful.
        </p>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight text-[var(--text)]">How we work</h2>
        <p className="mt-4 leading-7 text-[var(--text-muted)]">
          Where a task can run entirely in your browser, it does — the Thumbnail Size Checker never uploads or
          stores your image anywhere. We link to official platform documentation for anything that can change (like
          YouTube&apos;s thumbnail requirements) instead of guessing, and we say plainly when a result is an
          estimate rather than a guarantee.
        </p>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight text-[var(--text)]">Where we&apos;re headed</h2>
        <p className="mt-4 leading-7 text-[var(--text-muted)]">
          CreatorToolWorks is a small, independent project. Tools are added deliberately rather than in bulk, and
          only once they add real value. If the site is ever supported by advertising, ad placements will be clearly
          separated from tool controls and results — never disguised as part of the tool itself.
        </p>
      </section>
    </main>
  );
}
