import type { Metadata } from "next";
import Link from "next/link";
import { HeroIllustration } from "@/components/marketing/hero-illustration";
import { ToolCard } from "@/components/tool/tool-card";
import { siteConfig } from "@/lib/seo/site";
import { getVisitorFacingTools } from "@/lib/tools/registry";

export const metadata: Metadata = {
  alternates: { canonical: siteConfig.url },
};

const trustSignals = ["Free tools", "No signup", "Privacy-friendly"];

export default function HomePage() {
  const visitorFacingTools = getVisitorFacingTools();

  return (
    <main>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(60%_50%_at_80%_0%,var(--accent-soft),transparent),radial-gradient(45%_40%_at_5%_15%,var(--warm-soft),transparent)]"
        />
        <div className="site-container grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              CreatorToolWorks
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-bold tracking-tight text-[var(--text)] sm:text-6xl">
              Practical tools for creators.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-[var(--text-muted)]">
              Fast, browser-based utilities that help you publish with confidence — starting with YouTube. No
              installs, no accounts, nothing uploaded to a server.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/youtube-tools"
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
              >
                Browse YouTube tools
              </Link>
              <Link
                href="/youtube-tools/thumbnail-size-checker"
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-6 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Try the thumbnail checker
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[var(--text-muted)]">
              {trustSignals.map((signal) => (
                <li key={signal} className="inline-flex items-center gap-1.5">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="var(--success)"
                    strokeWidth="2"
                  >
                    <path d="M4 10.5l3.5 3.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {signal}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0">
            <HeroIllustration />
          </div>
        </div>
      </section>

      <section className="site-container pb-12 sm:pb-14">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Start with YouTube tools</h2>
        <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
          More categories are on the way. The platform is built to scale to a large library of creator tools over
          time.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visitorFacingTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>
    </main>
  );
}
