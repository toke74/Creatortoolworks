import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach CreatorToolWorks with feedback, bug reports, or questions.",
  alternates: { canonical: `${siteConfig.url}/contact` },
};

export default function ContactPage() {
  return (
    <main className="site-container py-14 sm:py-16">
      <PageHeader
        eyebrow="Contact"
        title="Contact us"
        description="Found a bug, have feedback, or a question about a tool? We'd like to hear it."
      />

      <section className="mt-12 max-w-2xl">
        <div className="card p-6">
          <p className="font-semibold text-[var(--text)]">Email</p>
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="mt-2 inline-block text-[var(--accent)] underline underline-offset-2"
          >
            {siteConfig.contactEmail}
          </a>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            This inbox is checked by a small team, not a 24/7 support desk — please allow a few days for a
            response. Include the tool name and, if relevant, the browser and device you were using; it helps a lot
            with bug reports.
          </p>
        </div>

        <p className="mt-6 text-sm leading-6 text-[var(--text-muted)]">
          CreatorToolWorks does not offer live chat, phone support, or guaranteed response times. For anything
          related to your privacy or data, see our{" "}
          <Link href="/privacy" className="text-[var(--accent)] underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
