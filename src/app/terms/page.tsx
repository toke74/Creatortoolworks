import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { siteConfig } from "@/lib/seo/site";

const EFFECTIVE_DATE = "2026-08-21";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms for using CreatorToolWorks' free, browser-based creator tools.",
  alternates: { canonical: `${siteConfig.url}/terms` },
};

export default function TermsPage() {
  return (
    <main className="site-container py-14 sm:py-16">
      <PageHeader
        eyebrow="Legal"
        title="Terms of Use"
        description={`Effective ${EFFECTIVE_DATE}. The basics of using CreatorToolWorks.`}
      />

      <section className="mt-12 max-w-3xl space-y-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Acceptance of these terms</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            By using CreatorToolWorks, you agree to these terms. If you don&apos;t agree, please don&apos;t use the
            site.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">The service</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            CreatorToolWorks provides free, browser-based utility tools for creators — for example, checking whether
            an image fits YouTube&apos;s current thumbnail requirements. Results are informational: checks are
            based on publicly published platform guidance at the time they were last verified, and estimates expose
            their own assumptions where relevant. Platforms can change their rules at any time, and we can&apos;t
            guarantee a specific outcome (such as a thumbnail being accepted) as a result of using a tool.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Acceptable use</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Please don&apos;t use the site to attempt to disrupt it (for example, automated abuse or excessive
            scraping), to probe it for security vulnerabilities without authorization, or for any unlawful purpose.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">No warranty</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            CreatorToolWorks is provided &quot;as is,&quot; without warranties of any kind, express or implied,
            including accuracy, availability, or fitness for a particular purpose. Always double-check
            upload-critical requirements against the official platform source linked on each tool page before you
            rely on a result.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Limitation of liability</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            To the fullest extent permitted by law, CreatorToolWorks is not liable for any indirect, incidental, or
            consequential damages arising from your use of, or inability to use, the site.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Your content</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Where a tool processes a file or image you provide, it does so locally in your browser — we don&apos;t
            receive, store, or claim any rights to that content. See our{" "}
            <Link href="/privacy" className="text-[var(--accent)] underline underline-offset-2">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Our content</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            The CreatorToolWorks name, brand mark, and site design belong to CreatorToolWorks. Platform names
            referenced (such as YouTube) belong to their respective owners; CreatorToolWorks is an independent
            project and is not affiliated with or endorsed by them.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Third-party links</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            CreatorToolWorks links to official third-party documentation (such as YouTube&apos;s Help Center) as a
            reference source for platform rules. We don&apos;t control those sites, and linking to them isn&apos;t
            an endorsement of their content. Your use of any third-party site is governed by that site&apos;s own
            terms.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Changes</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            We may update these terms as the site evolves. Continued use after an update means you accept the
            revised terms.
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
