import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ThumbnailSizeChecker } from "@/components/tool/thumbnail-size-checker";
import { ToolIcon } from "@/components/tool/tool-icon";
import { formatFileSize } from "@/lib/tools/thumbnail-checker/analyze";
import {
  youtubeThumbnailAcceptedMimeTypes,
  youtubeThumbnailMaxFileSizeDesktopBytes,
  youtubeThumbnailMaxFileSizeMobileBytes,
  youtubeThumbnailMinWidthPx,
  youtubeThumbnailRecommendedWidthPx,
} from "@/lib/platform-facts/youtube-thumbnail";
import { siteConfig } from "@/lib/seo/site";
import { getRelatedTools, getToolBySlug, tools } from "@/lib/tools/registry";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

const trustSignals = ["Free", "No upload", "Runs in your browser"];

export function generateStaticParams() {
  return tools.filter((tool) => tool.implemented).map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || !tool.implemented) return {};

  return {
    title: tool.name,
    description: tool.summary,
    alternates: { canonical: `${siteConfig.url}/youtube-tools/${tool.slug}` },
    robots: tool.status === "live" ? undefined : { index: false, follow: true },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || !tool.implemented) notFound();
  const related = getRelatedTools(tool);

  return (
    <main className="site-container py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "YouTube tools", href: "/youtube-tools" }, { label: tool.name }]} />

      <div className="mt-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <ToolIcon category={tool.category} />
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
            YouTube tools
          </p>
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--text)]">{tool.name}</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--text-muted)]">{tool.summary}</p>

        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[var(--text-muted)]">
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

      <section
        className="card mt-10 max-w-4xl p-6 shadow-[0_16px_40px_-24px_rgba(23,23,27,0.25)] sm:p-8"
        aria-labelledby="tool-workspace-title"
      >
        <h2 id="tool-workspace-title" className="text-xl font-semibold text-[var(--text)]">
          Check your thumbnail
        </h2>
        {tool.id === "thumbnail-size-checker" ? (
          <div className="mt-4">
            <ThumbnailSizeChecker toolId={tool.analyticsId} />
          </div>
        ) : null}
      </section>

      {tool.id === "thumbnail-size-checker" ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">How to use</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
            <li>Select or drag a JPG or PNG image into the drop zone above.</li>
            <li>Review the width, height, aspect ratio, and file size YouTube will see.</li>
            <li>Check each pass/warning/fail result and fix anything flagged before uploading.</li>
          </ol>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            YouTube thumbnail guidelines
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            This checker verifies your image against YouTube&apos;s current published requirements for standard
            custom thumbnails:
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Format: </span>
              {(youtubeThumbnailAcceptedMimeTypes.value as readonly string[])
                .map((mime) => mime.replace("image/", "").toUpperCase())
                .join(" or ")}
            </li>
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Width: </span>
              {youtubeThumbnailMinWidthPx.value}px minimum, {youtubeThumbnailRecommendedWidthPx.value}px recommended
            </li>
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Aspect ratio: </span>
              16:9 for standard videos
            </li>
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">File size: </span>
              up to {formatFileSize(youtubeThumbnailMaxFileSizeMobileBytes.value)} from the mobile app, up to{" "}
              {formatFileSize(youtubeThumbnailMaxFileSizeDesktopBytes.value)} from the web
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">What the results mean</h2>
          <ul className="mt-4 space-y-2 leading-7 text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">Pass</span> — meets YouTube&apos;s current
              guidance; no action needed.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Warning</span> — usable, but not ideal. Review it
              before you upload.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Fail</span> — likely to cause a problem on upload
              or display. Fix it first.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Methodology and limitations
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            This tool checks your image against YouTube&apos;s current published custom-thumbnail guidance for
            standard videos: file format, minimum/recommended width, recommended 16:9 aspect ratio, and mobile vs.
            web upload file-size limits. Dimensions and format come from what your browser reports for the file you
            selected. YouTube can change these requirements at any time, and YouTube may apply additional checks at
            upload time that this tool cannot see.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">FAQ</h2>
          <div className="mt-4 space-y-5">
            <div>
              <p className="font-semibold text-[var(--text)]">Does this tool upload my image anywhere?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Your image is analyzed entirely in your browser and is never sent to a server.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Why did a correctly sized image still get a warning?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                A warning means the file is usable but not optimal — for example, a width below YouTube&apos;s
                recommended (but above the minimum) resolution, or an aspect ratio other than 16:9.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Can this guarantee YouTube will accept my thumbnail?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. YouTube applies its own checks at upload time, and requirements can change. Use this tool as a
                pre-upload sanity check, not a final guarantee.
              </p>
            </div>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Source</h2>
          <div className="card mt-4 p-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              Rules on this page are checked against YouTube&apos;s own custom-thumbnail documentation, not
              third-party advice.
            </p>
            <a
              href={youtubeThumbnailMinWidthPx.sourceUrl}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              support.google.com — Add a custom video thumbnail
              <span aria-hidden="true">↗</span>
            </a>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Verified {youtubeThumbnailMinWidthPx.verifiedAt}. YouTube can change these requirements at any time.
            </p>
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="mt-14 max-w-4xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Related tools</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/youtube-tools/${item.slug}`}
                className="card flex items-center gap-3 p-4 transition hover:border-[var(--accent)]"
              >
                <ToolIcon category={item.category} className="h-9 w-9 shrink-0" />
                <span className="font-medium text-[var(--text)]">{item.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
