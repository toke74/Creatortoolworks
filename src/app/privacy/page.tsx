import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { siteConfig } from "@/lib/seo/site";

const EFFECTIVE_DATE = "2026-08-21";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What CreatorToolWorks does and does not collect, and how tool data is (and isn't) processed.",
  alternates: { canonical: `${siteConfig.url}/privacy` },
};

export default function PrivacyPage() {
  return (
    <main className="site-container py-14 sm:py-16">
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description={`Effective ${EFFECTIVE_DATE}. How CreatorToolWorks handles information when you use our tools or contact us.`}
      />

      <section className="mt-12 max-w-3xl space-y-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Overview</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            CreatorToolWorks provides free, browser-based tools for creators. This policy explains what happens to
            your data when you use the site, in plain language.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">What we don&apos;t collect</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Tools that work with a file or image — like the Thumbnail Size Checker — process it entirely in your
            browser. The file is never uploaded to our servers, never stored, and never sent to a third party. We
            don&apos;t require an account, a login, or any personal information to use a tool.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
            Hosting and infrastructure
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            CreatorToolWorks is served through Cloudflare, our hosting and content-delivery provider. Cloudflare may
            process request metadata — such as IP address, browser type, and requested page — and other information
            necessary for security purposes, such as detecting and blocking abuse. CreatorToolWorks does not
            currently use advertising or analytics cookies of its own.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
            Information you send us directly
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            If you email us at{" "}
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="text-[var(--accent)] underline underline-offset-2"
            >
              {siteConfig.contactEmail}
            </a>
            , we receive your email address and whatever you choose to include in your message. We use that
            information to respond to your message, troubleshoot issues, and improve CreatorToolWorks. We do not
            sell information you send us. Service providers used to deliver or host email may process it as
            necessary to provide those services.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Third parties</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            We link to official platform documentation (such as YouTube&apos;s Help Center) as a source for
            platform rules. Visiting those links takes you to that platform&apos;s own site, governed by their own
            privacy policy — we don&apos;t share any data with them as part of that.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Children&apos;s privacy</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            CreatorToolWorks is intended for a general audience and is not directed at children under 13. We do not
            knowingly collect personal information from children.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Changes to this policy</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            If this policy changes, we&apos;ll update the effective date above and, for material changes, note them
            clearly on this page.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Questions</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Reach us via the{" "}
            <Link href="/contact" className="text-[var(--accent)] underline underline-offset-2">
              contact page
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
